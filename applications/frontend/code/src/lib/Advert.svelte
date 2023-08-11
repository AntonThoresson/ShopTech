<script lang="ts">
  import {
    Container,
    Row,
    Col,
    Card,
    CardBody,
    CardTitle,
    CardText,
    Button,
  } from "sveltestrap";
  import APIBaseURL from "../config";

  export let id;
  let isfetchingAdvert = true;
  let failedTofetchAdvert = false;
  let advert = null;
  let showForm = false;
  let emailSent = false;
  let errorCodes = [];
  let advertOwnerEmail = "";

  async function loadAdvert() {
    try {
      const response = await fetch( APIBaseURL + "adverts/" + id);

      switch (response.status) {
        case 200:
          advert = await response.json();
          isfetchingAdvert = false;
          break;

        case 500:
          errorCodes.push("Internal server error")
          errorCodes = errorCodes
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      isfetchingAdvert = false;
      failedTofetchAdvert = true;
      console.log("error:", error);
    }
  }

  loadAdvert();

  async function loadAdvertCreatorEmail() {
    try {
      const response = await fetch(
        APIBaseURL + "accounts/advertCreatorEmail/" + id
      );

      switch (response.status) {
        case 200:
          const account = await response.json();
          advertOwnerEmail = account.email;
          console.log(advertOwnerEmail);
          break;

        case 500:
          errorCodes.push("Internal server error")
          errorCodes = errorCodes
          break;

        default:
          errorCodes.push("Unexpected response");
      }
    } catch (error) {
      console.log(error);
    }
  }

  loadAdvertCreatorEmail();

  function showFormOnClick() {
    showForm = true;
    emailSent = false;
  }

  function showEmailSent() {
    showForm = false;
    emailSent = true;
  }

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

  console.log(window.location.pathname);
</script>

<Container class="product-page">
  {#if isfetchingAdvert}
    <p>Wait, i'm fetching data...</p>
  {:else if failedTofetchAdvert}
    <p>Couldn't fetch advert, check your internet connection</p>
  {:else if advert}
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
            <CardTitle>{advert.title}</CardTitle>
            <CardText>{advert.description}</CardText>
            <p><b>Price:</b> {advert.price} SEK</p>
            <Button on:click={showFormOnClick}>Contact seller</Button>
          </CardBody>
        </Card>
      </Col>
    </Row>
  {:else}
    <p>No advert with the given id {id}.</p>
  {/if}

  {#if showForm}
    <Row>
      <form action="https://api.staticforms.xyz/submit" method="post">
        <div class="form-group">
          <label for="name">Your Name</label>
          <input
            type="text"
            id="name"
            name="name"
            class="form-control"
            placeholder="Enter your name"
          />
        </div>
        <div class="form-group">
          <label for="email">Your Email</label>
          <input
            type="email"
            id="email"
            name="email"
            class="form-control"
            placeholder="Enter your email"
          />
        </div>
        <div class="form-group">
          <label for="message">Message</label>
          <textarea
            id="message"
            name="message"
            class="form-control"
            placeholder="Enter your message"
          />
        </div>
        <div class="form-group">
          <label for="email">Reply to seller with Email:</label>
          <input
            type="text"
            name="replyTo"
            value={advertOwnerEmail}
            class="form-control"
          />
          <!--input type="email" id="email" name="email" class="form-control" placeholder="Enter your email"-->
        </div>
        <input type="text" name="honeypot" style="display:none" />
        <input
          type="hidden"
          name="accessKey"
          value="b313a48b-ba91-4b23-a92d-74320e451b26"
        />
        <input
          type="hidden"
          name="subject"
          value="Contact us from - example.com"
        />
        <!--input type="hidden" name="redirectTo" value="https://example.com/contact/success"-->
        <button type="submit" class="btn btn-primary" on:click={showEmailSent}
          >Submit</button
        >
      </form>
    </Row>
  {:else if emailSent}
    <Row>
      <h3>Email sent to seller!</h3>
    </Row>
  {/if}
</Container>
