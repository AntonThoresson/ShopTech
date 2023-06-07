import db from "../database-connection/db.js";
import { ACCESS_TOKEN_SECRET } from "./auth-controller.js";
import jwt from "jsonwebtoken";

const MIN_TITLE_LENGTH = 6;
const MAX_TITLE_LENGTH = 25;
const MIN_DESCRIPTION_LENGTH = 15;
const MAX_DESCRIPTION_LENGTH = 128;
const MIN_PRICE = 1;
const MAX_PRICE = Number.MAX_SAFE_INTEGER;
const DATABASE_ERROR_MESSAGE = "Internal server error";
const UNAUTHORIZED_USER_ERROR = "Unauthorized action performed";


export async function getUserAdverts(request, response) {
  let accountID = "";
  try {
    const user = await db.query("SELECT * FROM accounts WHERE email = ?", [
      request.params.id,
    ]);
    accountID = user[0].accountID;
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }

  try {
    const adverts = await db.query(
      "SELECT * FROM adverts WHERE accountID = ?",
      [accountID]
    );
    response.status(200).json(adverts);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function getAdverts(request, response) {
  try {
    const adverts = await db.query("SELECT * FROM adverts");
    response.status(200).json(adverts);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function getAdvertById(request, response) {
  try {
    const advert = await db.query("SELECT * FROM adverts WHERE advertID = ?", [request.params.id]);
    console.log("getAdvertById: advertID:", advert[0].advertID)
    response.status(200).json(advert[0]);
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function createAdvert(request, response) {
  const errorMessages = [];
  const advertData = request.body;

  const date = new Date();
  const timeNow = date.toISOString().split("T")[0];

  if (advertData.title.length == 0) {
    errorMessages.push("Title can't be null");
  } else if (MAX_TITLE_LENGTH < advertData.title.length) {
    errorMessages.push(
      "Title can't be more than " + MAX_TITLE_LENGTH + " characters long."
    );
  } else if (advertData.title.length < MIN_TITLE_LENGTH) {
    errorMessages.push(
      "Title can't be less than " + MIN_TITLE_LENGTH + " characters long."
    );
  }

  if (advertData.description.length == 0) {
    errorMessages.push("Description can't be null");
  } else if (MAX_DESCRIPTION_LENGTH < advertData.description.length) {
    errorMessages.push(
      "Description can't be more than " +
      MAX_DESCRIPTION_LENGTH +
      "characters long."
    );
  } else if (advertData.description.length < MIN_DESCRIPTION_LENGTH) {
    errorMessages.push(
      "Description can't be less than " +
      MIN_DESCRIPTION_LENGTH +
      " characters long."
    );
  }

  if (advertData.price == 0) {
    errorMessages.push("Price can't be 0");
  } else if (MAX_PRICE < advertData.price) {
    errorMessages.push("Price can't be more than " + MAX_PRICE + ".");
  } else if (advertData.price < MIN_PRICE) {
    errorMessages.push("Price can't be less than " + MIN_PRICE + ".");
  }

  if (0 < errorMessages.length) {
    response.status(400).json(errorMessages);
    return;
  }

  const userData = request.body.userData;
  let accountID = "";

  try {
    const user = await db.query("SELECT * FROM accounts WHERE email = ?", [userData.email]);
    accountID = user[0].accountID;
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }

  try {
    const authorizationHeaderValue = request.get("Authorization");
    const accessToken = authorizationHeaderValue.substring(7);
    const isSigned = accessToken.split('.').length === 3;

    if (isSigned) {
      const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

      if (!decodedToken.isLoggedIn) {
        throw new jwt.JsonWebTokenError();
      }
    }

    const values = [advertData.category, advertData.title, advertData.price, advertData.description, advertData.img_src, timeNow, accountID];
    const newAdvert = await db.query("INSERT INTO adverts (category, title, price, description, img_src, createdAt, accountID) VALUES (?,?,?,?,?,?,?)", values);
    response.status(201).send("Advert created successfully").json();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
    } else {
      console.error(error.status);
      response.status(500).json([DATABASE_ERROR_MESSAGE]);
    }
  }
}

export async function insertImageIntoAdvertById(request, response) {
  let accountID = "";
  try {
    const user = await db.query("SELECT * FROM accounts WHERE email = ?", [request.params.id]);
    accountID = user[0].accountID;
  } catch (error) {
    console.error(error.status);
  }
  let advertID = "";
  try {
    const id = accountID;
    const adverts = await db.query(
      "SELECT MAX(advertID) AS maxAdvertID FROM adverts WHERE accountID = ?",
      id
    );
    advertID = adverts[0].maxAdvertID;
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }

  const image = request.file.buffer.toString('base64')
  const updateID = advertID;
  try {
    const values = [image, updateID];
    const insertedImageIntoAdvert = await db.query("UPDATE adverts SET img_src = ? WHERE advertID = ?", values);
    response.status(200).send("Image insterted into advert successfully").json();
  } catch (error) {
    console.error(error.status);
    response.status(500).send(DATABASE_ERROR_MESSAGE);
  }
}

export async function updateAdvertById(request, response) {
  const advertData = request.body;
  if (!request.body) {
    response.status(400).send("Missing request body");
    return;
  }

  try {
    const authorizationHeaderValue = request.get("Authorization");
    const accessToken = authorizationHeaderValue.substring(7);
    const isSigned = accessToken.split('.').length === 3;

    if (!isSigned) {
      response.status(401).send("Unauthorized");
      return;
    }

    const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);
    console.log(decodedToken)

    if (!decodedToken.isLoggedIn) {
      throw new jwt.JsonWebTokenError();
    }

    console.log("decodedToken.userId", decodedToken.userId)
    console.log("advertData.accountID", advertData.accountID)
    if (decodedToken.userId !== advertData.accountID) {
      response.status(401).send("Unauthorized");
      return;
    }

    const values = [advertData.title, advertData.description, advertData.price, request.params.id];
    await db.query("UPDATE adverts SET title = ?, description = ?, price = ? WHERE advertID = ?", values);
    response.status(200).send("Advert updated successfully");
  } catch (error) {
    console.error(error);
    response.status(500).send("Internal server error");
  }
}

export async function deleteAdvertById(request, response) {
  try {
    const authorizationHeaderValue = request.get("Authorization");
    const accessToken = authorizationHeaderValue.substring(7);
    const isSigned = accessToken.split('.').length === 3;

    if (isSigned) {
      const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

      if (!decodedToken.isLoggedIn) {
        throw new jwt.JsonWebTokenError();
      }
    }

    await db.query("DELETE FROM adverts WHERE advertID = ? AND accountID = ?", [request.params.id, decodedToken.userId])
    response.status(204).send("Advert successfully deleted");
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
    } else {
      console.error(error.status);
      response.status(500).json([DATABASE_ERROR_MESSAGE]);
    }
  }
}
