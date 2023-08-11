<script lang="ts">
  import { Link, navigate } from "svelte-routing";
  import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Button,
    Alert,
  } from "sveltestrap";
  import { user } from "../user-store";
  import APIBaseURL from "../config";

  export let id;
  let isfetchingAdvert = true;
  let failedTofetchAdvert = false;
  let advert = null;
  let userData = null;
  let category = "";
  let title = "";
  let price = "";
  let description = "";
  let errorCodes = [];
  let adverts = [];
  let showUpdateConfirmation = false;
  let showDeleteConfirmation = false;

  async function loadUserData() {
    try {
      const response = await fetch(APIBaseURL + "accounts/" + $user.userEmail);
      console.log("user email from account: ", $user.userEmail);

      switch (response.status) {
        case 200:
          userData = await response.json();
          break;

        case 500:
          errorCodes.push("Internal server error");
          errorCodes = errorCodes;
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      console.log("error:", error);
    }
  }

  loadUserData();

  async function loadAdvert() {
    try {
      const response = await fetch(APIBaseURL + "adverts/" + id);

      switch (response.status) {
        case 200:
          advert = await response.json();
          category = advert.category;
          title = advert.title;
          price = advert.price;
          description = advert.description;
          isfetchingAdvert = false;
          break;

        case 500:
          errorCodes.push("Internal server error");
          errorCodes = errorCodes;
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      isfetchingAdvert = false;
      failedTofetchAdvert = true;
    }
  }
  loadAdvert();

  async function updateAdvert() {
    const advert = {
      category,
      title,
      price,
      description,
      accountID: userData.accountID,
    };

    try {
      const response = await fetch(APIBaseURL + "adverts/" + id, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + $user.accessToken,
        },
        body: JSON.stringify(advert),
      });

      switch (response.status) {
        case 200:
          navigate("/account", {
            replace: false,
          });
          break;

        case 401:
          errorCodes.push("Unauthorized");
          errorCodes = errorCodes;
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      console.log("error:", error);
    }
  }

  async function deleteAdvert() {
    try {
      const response = await fetch(APIBaseURL + "adverts/" + id, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + $user.accessToken,
        },
      });

      switch (response.status) {
        case 200:
          navigate("/account", {
            replace: false,
          });
          break;

        case 401:
          errorCodes.push("Unauthorized");
          errorCodes = errorCodes;
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      console.log("error:", error);
    }
  }

  async function loadUserAdverts() {
    try {
      const response = await fetch(
        APIBaseURL + "adverts/getUserAdverts/" + $user.userEmail
      );

      switch (response.status) {
        case 200:
          adverts = await response.json();
          console.log(adverts[0]);
          break;

        case 500:
          errorCodes.push("Internal server error");
          errorCodes = errorCodes;
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      console.log("error:", error);
    }
  }

  loadUserAdverts();

  function shouldShowStockPhoto(imagePath) {
    if (
      imagePath === "/MacBook_Pro_13-inch_M1_2020.png" ||
      imagePath === "/macbook2016.png"
    ) {
      return true;
    } else {
      return false;
    }
  }
</script>

{#if $user.isLoggedIn}
  <Container class="product-page">
    {#if isfetchingAdvert}
      <p>Wait, i'm fetching data...</p>
    {:else if failedTofetchAdvert}
      <p>Couldn't fetch advert, check your internet connection</p>
    {:else if advert}
      <form on:submit|preventDefault={updateAdvert}>
        <h1>{advert.title}</h1>
        <Row>
          <Col sm="12" md="6">
            <div class="advert-page-img-frame">
              {#if shouldShowStockPhoto(advert.img_src)}
                <img
                  class="card-img-top"
                  alt="MacBook Pro 16&quot; M1 2021"
                  title="MacBook Pro 16&quot; M1 2021"
                  src={advert.img_src}
                />
              {:else}
                <img
                  class="card-img-top"
                  alt="MacBook Pro 16&quot; M1 2021"
                  title="MacBook Pro 16&quot; M1 2021"
                  src={"data:image/png;base64," + advert.img_src}
                />
              {/if}
            </div>
          </Col>
          <Col sm="12" md="6">
            <Card class="product-details">
              <CardBody>
                <CardTitle
                  ><input
                    type="text"
                    class="input-field"
                    bind:value={title}
                  /></CardTitle
                >
                <CardText
                  ><textarea
                    rows="5"
                    class="input-field"
                    bind:value={description}
                  /></CardText
                >
                <p>
                  <b>Price:</b>
                  <input type="text" class="input-field" bind:value={price} />
                </p>
                <Row>
                  <button
                    on:click|preventDefault
                    on:click={() =>
                      (showUpdateConfirmation = !showUpdateConfirmation)}
                    class="btn btn-outline-dark mr-2 mt-3 mb-3"
                  >
                    Update advert
                  </button>
                  <Alert
                    color="primary"
                    isOpen={showUpdateConfirmation}
                    toggle={() => (showUpdateConfirmation = false)}
                    fade={false}
                  >
                    <button
                      type="submit"
                      class="btn btn-outline-dark mr-2 mt-3 mb-3"
                    >
                      Confirm update</button
                    >
                  </Alert>
                </Row>
                <Row>
                  <button
                    on:click|preventDefault
                    on:click={() =>
                      (showDeleteConfirmation = !showDeleteConfirmation)}
                    class="btn btn-outline-danger mt-3 mb-3"
                  >
                    Delete advert
                  </button>
                  <Alert
                    color="primary"
                    isOpen={showDeleteConfirmation}
                    toggle={() => (showDeleteConfirmation = false)}
                    fade={false}
                  >
                    <button
                      class="btn btn-outline-danger mt-3 mb-3"
                      on:click={() => deleteAdvert()}>Confirm delete</button
                    >
                  </Alert>
                </Row>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </form>
      {#if 0 < errorCodes.length}
        <p>the following errors occured:</p>

        <ul>
          {#each errorCodes as errorCode}
            <li>{errorCode}</li>
          {/each}
        </ul>
      {/if}
    {:else}
      <p>No advert with the given id {id}.</p>
    {/if}
  </Container>
{:else}
  <div class="centered-auth-section">
    <h4>Please Sign in to update adverts.</h4>
    <Button>
      <Link to="/Auth" class="nav-link active" aria-current="page">Sign in</Link
      >
    </Button>
  </div>
{/if}
