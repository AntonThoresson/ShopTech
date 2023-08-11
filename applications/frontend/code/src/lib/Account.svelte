<script>
  // @ts-nocheck
  import { Link, navigate, Route } from "svelte-routing";
  import { Button, Alert } from "sveltestrap";
  import { user } from "../user-store.js";
  import UpdateAccount from "./UpdateAccount.svelte";
  import UpdateAdvert from "./UpdateAdvert.svelte";
  import APIBaseURL from "../config.js";

  let isFetchingUserData = true;
  let failedToFetchUserData = false;
  let userData = null;
  let showDeleteConfirmation = false;
  let adverts = [];
  let errorCodes = [];

  async function loadUserData() {
    try {
      const response = await fetch(APIBaseURL + "accounts/" + $user.userEmail);
      console.log("user email from account: ", $user.userEmail);

      switch (response.status) {
        case 200:
          userData = await response.json();
          isFetchingUserData = false;
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
      isFetchingUserData = false;
      failedToFetchUserData = true;
    }
  }

  loadUserData();

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

  async function deleteAccount() {
    try {
      const response = await fetch(APIBaseURL + "accounts/" + $user.userEmail, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + $user.accessToken,
        },
      });

      switch (response.status) {
        case 200:
          navigate("/", {
            replace: false,
          });
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
</script>

{#if $user.isLoggedIn}
  {#if isFetchingUserData}
    <p>Wait, i'm fetching data...</p>
  {:else if failedToFetchUserData}
    <p>Couldn't fetch advert, check your internet connection</p>
  {:else if userData}
    <div class="container my-5">
      <div class="row">
        <div class="col-lg-4">
          <h3 class="mb-3 fw-bold">My Account</h3>
          <form>
            <ul class="list-group">
              <li class="list-group-item">
                <div class="form-group">
                  <label for="nameInput" class="fw-bold">Name</label>
                  <input
                    type="text"
                    class="form-control-plaintext"
                    id="nameInput"
                    value="{userData.firstName} {userData.lastName}"
                    readonly
                  />
                </div>
              </li>
              <li class="list-group-item">
                <div class="form-group">
                  <label for="emailInput" class="fw-bold">Email</label>
                  <input
                    type="email"
                    class="form-control-plaintext"
                    id="emailInput"
                    value={userData.email}
                    readonly
                  />
                </div>
              </li>
              <li class="list-group-item">
                <div class="form-group">
                  <label for="locationInput" class="fw-bold">Location</label>
                  <input
                    type="text"
                    class="form-control-plaintext"
                    id="locationInput"
                    value={userData.address}
                    readonly
                  />
                </div>
              </li>
              <li class="list-group-item">
                <div class="form-group">
                  <label for="emailInput" class="fw-bold">Phone Number</label>
                  <input
                    type="email"
                    class="form-control-plaintext"
                    id="emailInput"
                    value={userData.phoneNumber}
                    readonly
                  />
                </div>
              </li>
              <li class="list-group-item">
                <div class="form-group">
                  <label for="memberSinceInput" class="fw-bold"
                    >Member Since</label
                  >
                  <input
                    type="text"
                    class="form-control-plaintext"
                    id="memberSinceInput"
                    value={userData.createdAt}
                    readonly
                  />
                </div>
              </li>
            </ul>
            <button type="submit" class="btn btn-outline-dark mr-2 mt-3 mb-3"
              ><Link
                to="/updateAccount"
                class="nav-link active"
                aria-current="page">Update account info</Link
              ></button
            >
            <button
              on:click|preventDefault
              on:click={() =>
                (showDeleteConfirmation = !showDeleteConfirmation)}
              class="btn btn-outline-danger mt-3 mb-3"
            >
              Delete account
            </button>
            <Alert
              color="primary"
              isOpen={showDeleteConfirmation}
              toggle={() => (showDeleteConfirmation = false)}
              fade={false}
            >
              <button
                class="btn btn-outline-danger mt-3 mb-3"
                on:click={() => deleteAccount()}
                >Confirm deletion, this is irreversible</button
              >
            </Alert>
          </form>
        </div>
        <div class="col-lg-8">
          <h3 class="mb-3 fw-bold">Listings</h3>
          {#if adverts}
            <table class="table">
              <thead>
                <tr>
                  <th scope="col">Product Name</th>
                  <th scope="col">Category</th>
                  <th scope="col">Price</th>
                </tr>
              </thead>
              <tbody>
                {#each adverts as advert}
                  <tr>
                    <td>
                      <Link to="/advert/update/{advert.advertID}">
                        {advert.title}
                      </Link>
                    </td>
                    <td>{advert.category}</td>
                    <td>${advert.price}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          {:else}
            <p>You have no active adverts</p>
          {/if}
        </div>
      </div>
    </div>
    {#if 0 < errorCodes.length}
      <p>the following errors occured:</p>

      <ul>
        {#each errorCodes as errorCode}
          <li>{errorCode}</li>
        {/each}
      </ul>
    {/if}
  {:else}
    <p>No advert with the given id {$user.userEmail}.</p>
  {/if}
{:else}
  <div class="centered-auth-section">
    <h4>Please Sign in to see your account.</h4>
    <Button>
      <Link to="/Auth" class="nav-link active" aria-current="page">Sign in</Link
      >
    </Button>
  </div>
{/if}

<Route path="updateAccount" component={UpdateAccount} />
<Route path="/advert/update/:id" component={UpdateAdvert} />
