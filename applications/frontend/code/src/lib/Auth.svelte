<script lang="ts">
  import { navigate } from "svelte-routing";
  import { user } from "../user-store.js";
  import { Button } from "sveltestrap";
  import APIBaseURL from "../config.js";

  let email = "";
  let username = "";
  let password = "";
  let address = "";
  let firstName = "";
  let lastName = "";
  let phoneNumber = "";
  let accountWasCreated = false;
  let errorCodes = [];

  async function signUp() {
    const account = {
      email,
      username,
      password,
      address,
      firstName,
      lastName,
      phoneNumber,
    };

    try {
      const response = await fetch(APIBaseURL + "accounts/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
      });

      switch (response.status) {
        case 201:
          accountWasCreated = true;
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

  let showSignIn = true;

  async function signIn() {
    const response = await fetch(APIBaseURL + "accounts/tokens/", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Bearer " + $user.accessToken,
      },
      body: `grant_type=password&username=${encodeURIComponent(
        email
      )}&password=${encodeURIComponent(password)}`,
    });

    const body = await response.json();
    console.log("body: ", body);

    const accessToken = body.access_token;
    const emailFromAuth = body.username;

    console.log(response.status);
    switch (response.status) {
      case 200:
        if (body.admin == "admin") {
          $user = {
            isLoggedIn: true,
            accessToken,
            userEmail: emailFromAuth,
            isAdmin: true,
          };
        } else {
          $user = {
            isLoggedIn: true,
            accessToken,
            userEmail: emailFromAuth,
            isAdmin: false,
          };
        }
        navigate("/account", {
          replace: false,
        });

        break;

      case 400:
        errorCodes.push("Invalid credentials.");
        errorCodes = errorCodes;
        break;

      default:
        errorCodes.push("Unexpected response");
    }
  }

  function onSignUpSubmitted() {
    email = "";
    password = "";
    username = "";
    firstName = "";
    lastName = "";
    phoneNumber = "";
    accountWasCreated = false;
    showSignIn = true;
  }

  function onSignInSubmitted() {
    errorCodes = [];
  }

  function signInWithGoogle() {
    var oauth2Endpoint = "https://accounts.google.com/o/oauth2/v2/auth";

    var form = document.createElement("form");
    form.setAttribute("method", "GET");
    form.setAttribute("action", oauth2Endpoint);

    var params = {
      client_id:
        "201835937760-f6akivk873pvq9cpoptsj9n4r2ktc2hj.apps.googleusercontent.com",
      redirect_uri: "http://127.0.0.1:5173/auth-response",
      response_type: "token",
      scope:
        "https://www.googleapis.com/auth/userinfo.profile openid https://www.googleapis.com/auth/userinfo.email",
      include_granted_scopes: "true",
      state: "pass-through value",
    };

    for (var p in params) {
      var input = document.createElement("input");
      input.setAttribute("type", "hidden");
      input.setAttribute("name", p);
      input.setAttribute("value", params[p]);
      form.appendChild(input);
    }

    document.body.appendChild(form);
    form.submit();
  }
</script>

<div class="container">
  <div class="row">
    {#if accountWasCreated}
      <div>
        <h1>Account was created!</h1>
        <Button id="sellTechButton" on:click={() => onSignUpSubmitted()}>
          Sign in
        </Button>
      </div>
    {:else}
      <div class="col me-5 form-box">
        <h2 class="mt-5">signIn or create an account to continue</h2>
        <div class="button-box mb-3">
          <div id="special-btn" />
          <button
            type="button"
            class="toggle-btn"
            class:active={showSignIn == true}
            id="signIn-btn"
            on:click={() => (showSignIn = true)}>Sign in</button
          >
          <button
            type="button"
            class="toggle-btn"
            class:active={showSignIn == false}
            id="signup-btn"
            on:click={() => (showSignIn = false)}>Sign up</button
          >
        </div>
        {#if showSignIn}
          <button class="button-google" on:click={() => signInWithGoogle()}>
            <img
              class="button-google__icon"
              src="/signin-with-google-button-logo.png"
              alt="sign_in_with_Google"
            />
            <span class="button-google__text">Sign in with Google</span>
          </button>
          <p class="signInFormParagraph">Or continue with email and password</p>
          <form
            class="input-group"
            id="signIn-form"
            on:submit|preventDefault={signIn}
            on:submit={onSignInSubmitted}
          >
            <div class="mb-3 mt-2">
              <input
                type="username"
                class="form-control"
                id="exampleInputEmail1"
                aria-describedby="emailHelp"
                placeholder="Email"
                style="width: 400px;"
                bind:value={email}
              />
            </div>
            <div class="mb-3">
              <input
                type="password"
                class="form-control"
                id="exampleInputPassword1"
                placeholder="Password"
                style="width: 400px;"
                bind:value={password}
              />
            </div>
            <div class="signUpPageButton">
              <Button type="submit" value="signIn">sign in</Button>
            </div>
          </form>
          {#if errorCodes.length}
            <p>Errors:</p>
            <ul>
              {#each errorCodes as errorCode}
                <li>{errorCodes}</li>
              {/each}
            </ul>
          {/if}
        {:else}
          <form
            class="input-group"
            id="register-form"
            on:submit|preventDefault={signUp}
          >
            <div class="mb-3 mt-2">
              <div class="mb-3">
                <input
                  type="text"
                  class="form-control"
                  id="exampleInputPassword1"
                  placeholder="Email"
                  style="width: 400px;"
                  bind:value={email}
                />
              </div>
              <div class="mb-3">
                <input
                  type="text"
                  class="form-control"
                  id="exampleInputPassword1"
                  placeholder="username"
                  style="width: 400px;"
                  bind:value={username}
                />
              </div>
              <div class="mb-3">
                <input
                  type="password"
                  class="form-control"
                  id="exampleInputPassword1"
                  placeholder="Password"
                  style="width: 400px;"
                  bind:value={password}
                />
              </div>
              <div class="mb-3">
                <input
                  type="text"
                  class="form-control"
                  id="exampleInputPassword1"
                  placeholder="Address"
                  style="width: 400px;"
                  bind:value={address}
                />
              </div>
              <input
                type="text"
                class="form-control"
                placeholder="First name"
                style="width: 400px;"
                bind:value={firstName}
              />
            </div>
            <div class="mb-3">
              <input
                type="text"
                class="form-control"
                id="exampleInputPassword1"
                placeholder="Last name"
                style="width: 400px;"
                bind:value={lastName}
              />
            </div>
            <div class="mb-3">
              <input
                type="text"
                class="form-control"
                placeholder="Phone Number"
                style="width: 400px;"
                bind:value={phoneNumber}
              />
            </div>
            <div class="signUpPageButton">
              <Button type="submit" id="CreateAdButton" value="Signup">
                Sign up
              </Button>
            </div>
          </form>
          {#if errorCodes.length}
            <p>Errors:</p>
            <ul>
              {#each errorCodes as errorCode}
                <li>{errorCode}</li>
              {/each}
            </ul>
          {/if}
        {/if}
      </div>
    {/if}
    <div class="col col-media-hide mt-5">
      <img
        src="/appleProductsStockPhoto.png"
        alt="/appleProductsStockPhoto.png"
        id="sellTechImg"
      />
    </div>
  </div>
</div>
