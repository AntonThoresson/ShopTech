<script>
  import { Router, Link, navigate } from "svelte-routing";
  import { onMount } from "svelte";
  import { user } from "../user-store";
  let question = "";
  let answer = "";
  let errorMessages = [];
  import APIBaseURL from "../config";

  async function submitForm() {
    const response = await fetch(APIBaseURL + "faq", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + $user.accessToken,
      },
      body: JSON.stringify({ question, answer }),
    });
    if (
      response.status == 400 ||
      response.status == 401 ||
      response.status == 404 ||
      response.status == 500
    ) {
      errorMessages = await response.json();
    } else if (response.ok) {
      console.log("FAQ created successfully");
      const locationHeader = response.headers.get("Location");
      console.log(locationHeader);
      question = "";
      answer = "";
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
      <h2 class="mt-5">Create FAQ</h2>
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
          <label for="update-faq-input">Question</label>
          <input
            type="text"
            class="form-control"
            id="update-faq-input"
            bind:value={question}
            aria-describedby="emailHelp"
            placeholder="Question"
            style="width: 400px;"
          />
          <div class="form-floating mt-3">
            <textarea
              class="form-control"
              id="floatingTextarea2"
              bind:value={answer}
              style="height: 130px; width: 400px"
            />
            <label for="floatingTextarea2">Answer</label>
          </div>
          <button type="submit" class="btn btn-outline-dark mr-2 mt-3 mb-3"
            >Submit</button
          >
        </div>
      </form>
    </div>
  </div>
</div>
