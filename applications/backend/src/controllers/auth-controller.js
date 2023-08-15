import db from "../database-connection/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";
import crypto from 'crypto'

export const ACCESS_TOKEN_SECRET = "83hrb4gruyeiw24kdwe7";
const SALT_ROUNDS = 10;
const MIN_EMAIL_LENGTH = 6;
const MAX_EMAIL_LENGTH = 128;
const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const MIN_FIRSTNAME_LENGTH = 2;
const MAX_FIRSTNAME_LENGTH = 128;
const MIN_LASTNAME_LENGTH = 2;
const MAX_LASTNAME_LENGTH = 128;
export const ADMIN_EMAIL = "admin@shoptech.com";
const DATABASE_ERROR_MESSAGE = "Internal server error";
const UNAUTHORIZED_USER_ERROR = "Unauthorized action performed";

const generateRandomString = (length) => {
  return crypto.randomBytes(length).toString('hex');
};

const ID_TOKEN_SECRET = generateRandomString(32);

export async function getUserByEmail(request, response) {
  try {
    const user = await db.query("SELECT * FROM accounts WHERE email = ?", [
      request.params.id,
    ]);
    response.status(200).json(user[0]);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function getUserByAdvertId(request, response) {
  let accountID = "";
  try {
    const adverts = await db.query("SELECT * FROM adverts WHERE advertID = ?", [request.params.id]);
    accountID = adverts[0].accountID;
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }

  try {
    const user = await db.query("SELECT * FROM accounts WHERE accountID = ?", [accountID]);
    response.status(200).json(user[0]);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function signIn(request, response) {
  const grantType = request.body.grant_type;
  const username = request.body.username;
  const password = request.body.password;
  let existingPassword = "";
  let user;

  try {
    user = await db.query("SELECT * FROM accounts WHERE email = ?", username);
    existingPassword = user[0]?.password || "";
  } catch (error) {
    console.error(error);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
    return;
  }

  if (grantType !== "password") {
    response.status(400).json({ error: "unsupported_grant_type" });
    return;
  }
  const isMatch = await bcrypt.compare(password, existingPassword);

  if (!isMatch) {
    response
      .status(400)
      .json({ error: "invalid_grant", authError: "Sign in failed. Invalid credentials." });
    return;
  }

  let payload = null;
  const isAdmin = (username === ADMIN_EMAIL);

  payload = {
    isAdmin: isAdmin,
    isLoggedIn: true,
    userId: user[0].accountID,
  };

  const idToken = jwt.sign({ userId: user[0].accountID }, ID_TOKEN_SECRET, {
    expiresIn: '1h',
  });

  jwt.sign(payload, ACCESS_TOKEN_SECRET, function (error, accessToken) {
    if (error) {
      response.status(500).end();
    } else {
      response.status(200).json({
        access_token: accessToken,
        id_token: idToken,
        type: "bearer",
        username: username,
        isAdmin: isAdmin,
      });
    }
  });
}

function validateEmail(email) {
  var re = /\S+@\S+\.\S+/;
  return re.test(email);
}

export async function signUp(request, response) {
  const accountData = request.body;
  const errorMessages = [];
  let emailTaken;
  const hashedPassword = await bcrypt.hash(accountData.password, SALT_ROUNDS);

  const date = new Date();
  const createdAt = date.toISOString().split("T")[0];

  const regexCheckNumber = /^(?=.*[0-9])/;
  const regexCheckSpecialCharacter = /^(?=.*[!@#$%^&*])/;

  if (!validateEmail(accountData.email)) {
    errorMessages.push("Invalid email");
  }
  if (accountData.address.length == 0) {
    errorMessages.push("Address can't be null, please enter a valid address.");
  }
  if (accountData.phoneNumber.length == 0) {
    errorMessages.push("Invalid phone number: Too short");
  } else if (!(regexCheckNumber.test(accountData.phoneNumber))) {
    errorMessages.push("Invalid phone number: Must be digits only");
  }
  if (regexCheckSpecialCharacter.test(accountData.password)) {
    errorMessages.push("Password must contain at least one special character");
  } else if (accountData.password.length == 0) {
    errorMessages.push("Password length can't be 0");
  } else if (accountData.password.length < MIN_PASSWORD_LENGTH) {
    errorMessages.push("Password must be at least " + MIN_PASSWORD_LENGTH + " characters long");
  } else if (MAX_PASSWORD_LENGTH < accountData.password.length) {
    errorMessages.push("Password can't be more than " + MAX_PASSWORD_LENGTH + " characters long");
  }

  try {
    emailTaken = await db.query("SELECT * FROM accounts WHERE email = ?", [accountData.email]);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
  if (!(emailTaken === null || emailTaken == "")) {
    errorMessages.push("Email address already in use")
  }
  if (accountData.email.length == 0) {
    errorMessages.push("Email length can't be 0");
  } else if (accountData.email.length < MIN_EMAIL_LENGTH) {
    errorMessages.push(
      "Email can't be less than " + MIN_EMAIL_LENGTH + " characters long"
    );
  } else if (MAX_EMAIL_LENGTH < accountData.email.length) {
    errorMessages.push(
      "Email can't be more than " + MAX_EMAIL_LENGTH + " characters long"
    );
  }

  if (accountData.firstName.length == 0) {
    errorMessages.push("First name length can't be 0");
  } else if (accountData.firstName.length < MIN_FIRSTNAME_LENGTH) {
    errorMessages.push(
      "First name must be at least " + MIN_FIRSTNAME_LENGTH + " characters long"
    );
  } else if (MAX_FIRSTNAME_LENGTH < accountData.firstName.length) {
    errorMessages.push(
      "First name can't be more than " +
      MAX_FIRSTNAME_LENGTH +
      " characters long"
    );
  }

  if (accountData.lastName.length == 0) {
    errorMessages.push("Last name length can't be 0");
  } else if (accountData.lastName.length < MIN_LASTNAME_LENGTH) {
    errorMessages.push(
      "Last name must be at least " + MIN_LASTNAME_LENGTH + " characters long"
    );
  } else if (MAX_LASTNAME_LENGTH < accountData.lastName.length) {
    errorMessages.push(
      "Last name can't be more than " + MAX_LASTNAME_LENGTH + " characters long"
    );
  }

  if (0 < errorMessages.length) {
    response.status(400).json(errorMessages);
    return;
  }

  try {
    const values = [
      accountData.email,
      accountData.username,
      hashedPassword,
      accountData.address,
      accountData.firstName,
      accountData.lastName,
      accountData.phoneNumber,
      createdAt,
    ];
    await db.query(
      "INSERT INTO accounts (email, username, password, address, firstName, lastName, phoneNumber, createdAt) VALUES (?,?,?,?,?,?,?,?)",
      values
    );
    response.status(201).send("Account created successfully").json();
    console.log("Account created successfully");
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function registerGoogleAuthUser(request, response) {
  const accountData = request.body;
  const date = new Date();
  const createdAt = date.toISOString().split("T")[0];

  try {
    const values = [
      accountData.emailFromUserStore,
      accountData.firstName,
      accountData.lastName,
      createdAt,
    ];
    const newAccount = await db.query(
      "INSERT INTO accounts (email, firstName, lastName, createdAt) VALUES (?,?,?,?)",
      values
    );
    response.status(201).send("Account created successfully").json();
    console.log("Account created successfully");
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function updateAccountByEmail(request, response) {
  const accountData = request.body;
  let username = "";

  if (!request.body) {
    response.status(400).send("Missing request body");
    return;
  }
  try {
    const authorizationHeaderValue = request.get("Authorization");
    if (!authorizationHeaderValue || !authorizationHeaderValue.startsWith("Bearer ")) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      return;
    }
    const accessToken = authorizationHeaderValue.substring(7);
    const isSigned = accessToken.split('.').length === 3;

    if (!isSigned) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      return;
    }

    const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

    if (!decodedToken.isLoggedIn) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      return;
    }

    if (decodedToken.userId !== accountData.userData.accountID) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      return;
    }

    const user = await db.query(
      "SELECT accountID, username FROM accounts WHERE accountID = ?",
      [decodedToken.userId]
    );
    username = user[0].username;
    accountID = decodedToken.userId;

    if (username === "" || username === null) {
      username = accountData.userData.email;
    }

    const values = [accountData.firstName, accountData.lastName, accountData.address, accountData.phoneNumber, request.params.id];
    await db.query("UPDATE accounts SET firstName = ?, lastName = ?, address = ?, phoneNumber = ? WHERE email = ?", values);
    response.status(200).send("Account updated successfully").json();
  } catch (error) {
    response.status(500).json([DATABASE_ERROR_MESSAGE]);
  }
}

export async function deleteAccountByEmail(request, response) {
  try {
    const authorizationHeaderValue = request.get("Authorization");
    const accessToken = authorizationHeaderValue.substring(7);
    const isSigned = accessToken.split('.').length === 3;

    const user = await db.query("SELECT * FROM accounts WHERE email = ?", [
      request.params.id,
    ]);

    if (isSigned) {
      const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

      if (!decodedToken.isLoggedIn || decodedToken.userId !== user[0].accountID) {
        response.status(401).send("Unauthorized");
        return;
      }
    } else {
      response.status(401).send("Unauthorized");
      return;
    }

    await db.query("DELETE FROM accounts WHERE email = ?", [request.params.id]);
    response.status(204).send("Account successfully deleted");
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
    } else {
      console.error(error.status);
      response.status(500).json([DATABASE_ERROR_MESSAGE]);
    }
  }
}

