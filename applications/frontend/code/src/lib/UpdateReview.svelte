<script>
  import { navigate } from "svelte-routing";
  import { user } from "../user-store.js";
  import APIBaseURL from "../config.js";
  export let id;
  let review = null;
  let updatedUsername = "";
  let updatedDescription = "";
  let updatedStars = "";
  let failedToFetchReview = false;
  let errorMessages = [];

  async function submitForm() {
    console.log(updatedStars);
    const response = await fetch(APIBaseURL + "reviews/" + id, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + $user.accessToken,
      },
      body: JSON.stringify({
        updatedUsername,
        updatedDescription,
        updatedStars,
        accountID: $user.accountID,
      }),
    });
    if (
      response.status == 400 ||
      response.status == 401 ||
      response.status == 500
    ) {
      errorMessages = await response.json();
    } else if (response.ok) {
      updatedUsername = "";
      updatedDescription = "";
      updatedStars = "";
      navigate("/review/" + id, {
        replace: false,
      });
    }
  }

  async function loadReview() {
    try {
      const response = await fetch(APIBaseURL + "reviews/" + id);
      switch (response.status) {
        case 200:
          review = await response.json();
          updatedUsername = review.username;
          updatedDescription = review.description;
          updatedStars = review.stars;
          break;
      }
    } catch (error) {
      failedToFetchReview = true;
    }
  }
  loadReview();
</script>

<div class="ms-5">
  <div class="row">
    <div class="col me-5 form-box">
      <h2 class="mt-5">Update Review</h2>
      {#if errorMessages.length}
        <ul>
          {#each errorMessages as error}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}
      {#if failedToFetchReview}
        <p>Internal server error</p>
      {:else}
        <form
          class="input-group"
          id="register-form"
          on:submit|preventDefault={submitForm}
        >
          <div class="mb-3 mt-2">
            <input
              type="text"
              readonly
              class="form-control"
              id="update-faq-input"
              aria-describedby="emailHelp"
              bind:value={updatedUsername}
              style="width: 400px;"
            />
            <div class="form-floating mt-3">
              <textarea
                class="form-control"
                id="floatingTextarea2"
                bind:value={updatedDescription}
                style="height: 130px; width: 400px"
              />
              <label for="floatingTextarea2">Description</label>
            </div>
            <div class="form-group">
              <!-- svelte-ignore a11y-label-has-associated-control -->
              <label class="form-option">Stars</label>
              <select
                class="form-select"
                bind:value={updatedStars}
                id="form-option"
              >
                <option>0</option>
                <option>1</option>
                <option>2</option>
                <option>3</option>
                <option>4</option>
                <option>5</option>
              </select>
            </div>
            <button type="submit" class="btn btn-outline-dark mr-2 mt-3 mb-3"
              >Update</button
            >
          </div>
        </form>
      {/if}
    </div>
  </div>
</div>
