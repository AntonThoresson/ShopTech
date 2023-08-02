<script>
  import { navigate } from "svelte-routing";
  import { user } from "../user-store.js";
  import APIBaseURL from "../config.js";
  let description = "";
  let stars = "";
  let errorMessages = [];

  async function submitForm() {
    let userEmail = $user.userEmail;
    const response = await fetch(APIBaseURL + "reviews", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + $user.accessToken,
      },
      body: JSON.stringify({ userEmail, description, stars, accountID: $user.accountID}),
    });
    if (response.status == 400 || response.status == 500) {
      errorMessages = await response.json();
    } else if (response.ok) {
      const locationHeader = response.headers.get("Location");
      description = "";
      stars = "";
      if (locationHeader) {
        navigate(locationHeader, {
          replace: false,
        });
      }
    }
  }
</script>

<div class="ms-5">
  <div class="row">
    <div class="col me-5 form-box">
      <h2 class="mt-5">Create Review</h2>
      {#if errorMessages.length}
        <ul>
          {#each errorMessages as error}
            <li>{error}</li>
          {/each}
        </ul>
      {/if}
      <form
        class="input-group"
        id="register-form"
        on:submit|preventDefault={submitForm}
      >
        <div class="mb-3 mt-2">
          <div class="form-floating mt-3">
            <textarea
              class="form-control"
              id="floatingTextarea2"
              bind:value={description}
              style="height: 130px; width: 400px"
            />
            <label for="floatingTextarea2">Description</label>
          </div>
          <div class="form-group">
            <label for="form-select" class="form-label">Stars</label>
            <select
              class="form-select"
              name="grade"
              id="form-select"
              bind:value={stars}
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
            >Submit</button
          >
        </div>
      </form>
    </div>
  </div>
</div>
