<script lang="ts">
  import { Link, Route } from "svelte-routing";
  import Home from "../lib/Home.svelte";
  import { Container, Col, Row, Button } from "sveltestrap";
  import { FormGroup, FormText, Input, Label } from "sveltestrap";
  import { user } from "../user-store.js";
  import APIBaseURL from "../config";

  let selectedCategory = "";
  function handleSelect(event) {
    selectedCategory = event.target.value;
  }

  let category = "";
  let title = "";
  let price = "";
  let description = "";
  let img_src = "/MacBook_Pro_13-inch_M1_2020.png";
  let createdAt = "";
  let errorCodes = [];
  let advertWasCreated = false;
  let isFetchingUserData = true;
  let failedToFetchUserData = false;
  let userData = null;

  async function loadUserData() {
    try {
      const response = await fetch(APIBaseURL + "accounts/" + $user.userEmail);

      switch (response.status) {
        case 200:
          userData = await response.json();
          isFetchingUserData = false;
          break;
      }
    } catch (error) {
      console.log("error:", error);
      isFetchingUserData = false;
      failedToFetchUserData = true;
    }
  }

  loadUserData();

  async function handleFileUpload(event) {
    const fileInput = event.target.querySelector('input[type="file"]');
    const file = fileInput.files[0];
    const data = new FormData();
    data.append("image", file);

    try {
      const response = await fetch(
        APIBaseURL + "adverts/upload/" + $user.userEmail,
        {
          method: "PATCH",
          body: data,
        }
      );
      console.log(response);
    } catch (error) {
      console.error(error);
    }
  }

  async function createAdvert() {
    console.log("CREATE ADVERT");
    const advert = {
      category,
      title,
      price,
      description,
      img_src,
      createdAt,
      userData,
    };

    try {
      const response = await fetch(APIBaseURL + "adverts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + $user.accessToken,
        },
        body: JSON.stringify(advert),
      });

      switch (response.status) {
        case 201:
          advertWasCreated = true;
          break;

        case 400:
          errorCodes = await response.json();
          break;
      }
    } catch (error) {
      errorCodes.push("COMMUNICATION_ERROR");
      errorCodes = errorCodes;
    }
  }

  async function getData() {
    await Promise.all([createAdvert(), handleFileUpload(event)]);
  }
</script>

{#if $user.isLoggedIn}
  {#if advertWasCreated}
    <p>Advert was created!</p>
  {:else}
    <div id="CreateAd">
      <Container>
        <Row cols={2}>
          <Row>
            <Col id="CreateAdSpecifications" sm={{ offset: 1 }}>
              <form
                on:submit|preventDefault={getData}
                enctype="multipart/form-data"
              >
                <FormGroup class="CreateAdForm">
                  <Label for="exampleSelect">Select Category:</Label>
                  <Input
                    type="select"
                    name="select"
                    id="exampleSelect"
                    on:change={handleSelect}
                    bind:value={category}
                  >
                    <option>iPhone</option>
                    <option>iPad</option>
                    <option>MacBook</option>
                    <option>iMac</option>
                  </Input>
                </FormGroup>

                <FormGroup class="CreateAdForm">
                  <Label for="exampleSelect">Title:</Label>
                  <Input
                    type="text"
                    name="search"
                    id="exampleSearch"
                    placeholder="ex: iPhone 13 Pro"
                    bind:value={title}
                  />
                </FormGroup>

                <FormGroup class="CreateAdForm">
                  <Label for="exampleSelect">Description:</Label>
                  <Input
                    type="text"
                    name="search"
                    id="exampleSearch"
                    placeholder="ex: The iPhone is in very good condition..."
                    bind:value={description}
                  />
                </FormGroup>

                <FormGroup class="CreateAdForm">
                  <Label for="exampleSelect">Price:</Label>
                  <Input
                    type="text"
                    bind:value={price}
                    name="search"
                    id="exampleSearch"
                    placeholder="ex: $899"
                  />
                </FormGroup>
                <FormGroup>
                  <Label for="exampleFile">Upload picture</Label>
                  <!--Input type="file" name="image" bind:value={img_src}/-->
                  <Input type="file" name="image" />
                  <FormText color="muted">
                    Please choose at least one clear picture of your device. If
                    no clear picture is submitted we reserve the right to reject
                    the ad.
                  </FormText>
                </FormGroup>

                <Col sm={{ offset: 2 }}>
                  <Button type="submit" id="CreateAdButton" value="Create ad">
                    Create Ad
                  </Button>
                </Col>
                <!--input type="submit" value="Create ad"-->
              </form>
            </Col>
          </Row>
          <Col>
            <div id="CreateAdPictureAndText">
              <p>Sell your old tech to us and get a fair price.</p>
              <p>We guarantee that we can offer the highest price.</p>
              <p>If you were to find a better price, we’ll match it.</p>
            </div>
            <Col>
              <img
                src="./appleProductsStockPhoto.png"
                alt="./appleProductsStockPhoto.png"
                id="CreateAdImg"
              />
            </Col>
          </Col>
        </Row>
      </Container>
    </div>

    {#if 0 < errorCodes.length}
      <p>the following errors occured:</p>

      <ul>
        {#each errorCodes as errorCode}
          <li>{errorCode}</li>
        {/each}
      </ul>
    {/if}
  {/if}
{:else}
  <div class="centered-auth-section">
    <h4>Please Sign in to create adverts.</h4>
    <Button>
      <Link to="/Auth" class="nav-link active" aria-current="page">Sign in</Link
      >
    </Button>
  </div>
{/if}

<Route path="/home" component={Home} />
