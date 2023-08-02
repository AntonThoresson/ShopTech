import db from "../database-connection/db.js";
import jwt from "jsonwebtoken";
import { ACCESS_TOKEN_SECRET } from "./auth-controller.js";
const REVIEW_DESCRIPTION_MAX_LENGTH = 300;
const REVIEW_DESCRIPTION_MIN_LENGTH = 5;
const REVIEW_STARS_MAX = 5;
const REVIEW_STARS_MIN = 0;
const DATABASE_ERROR_MESSAGE = "Internal server error";
const UNAUTHORIZED_USER_ERROR = "Unauthorized action performed";

function getErrorMessagesForReview(description, stars) {
  const errorMessages = [];

  if (description.length > REVIEW_DESCRIPTION_MAX_LENGTH) {
    errorMessages.push(
      "Description may at most be " +
      REVIEW_DESCRIPTION_MAX_LENGTH +
      " characters long"
    );
  } else if (description.length < REVIEW_DESCRIPTION_MIN_LENGTH) {
    errorMessages.push(
      "Description can't be less than " +
      REVIEW_DESCRIPTION_MIN_LENGTH +
      " characters long"
    );
  }

  if (isNaN(stars)) {
    errorMessages.push("Stars must be a number");
  } else if (stars > REVIEW_STARS_MAX) {
    errorMessages.push("Stars may at most be " + REVIEW_STARS_MAX);
  } else if (stars < REVIEW_STARS_MIN) {
    errorMessages.push("Stars can't be negative");
  }
  return errorMessages;
}

export async function getReviews(requset, response) {
  try {
    const reviews = await db.query("SELECT * FROM reviews");
    response.status(200).json(reviews);
  } catch (error) {
    console.error(error);
    response.status(500).json(DATABASE_ERROR_MESSAGE);
  }
}

export async function getReviewById(request, response) {
  try {
    const review = await db.query("SELECT * FROM reviews WHERE reviewID = ?", [
      request.params.id,
    ]);
    response.status(200).json(review[0]);
  } catch (error) {
    console.error(error);
    response.status(500).json(DATABASE_ERROR_MESSAGE);
  }
}

export async function createReview(request, response) {
  let username = "";
  let accountID = null;
  const errorMessages = getErrorMessagesForReview(
    request.body.description,
    parseInt(request.body.stars)
  );
  if (!errorMessages.length == 0) {
    response.status(400).json(errorMessages);
    return;
  } else {
    try {
      const user = await db.query(
        "SELECT accountID, username FROM accounts WHERE email = ?",
        [request.body.userEmail]
      );
      username = user[0].username;
      accountID = user[0].accountID;
    } catch (error) {
      console.log(error);
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

      if (decodedToken.accountID !== request.body.accountID) {
        response.status(401).json([UNAUTHORIZED_USER_ERROR]);
        return;
      }

      const user = await db.query(
        "SELECT accountID, username FROM accounts WHERE email = ?",
        [decodedToken.accountID]
      );
      username = user[0].username;
      accountID = decodedToken.accountID;

      if(username === "" || username === null){
        username = request.body.userEmail
      }
      const date = new Date();
      const timeNow = date.toISOString().split("T")[0];
      const values = [
        username,
        request.body.description,
        request.body.stars,
        timeNow,
        accountID,
      ];
      const newReview = await db.query(
        "INSERT INTO reviews (username, description, stars, createdAt, accountID) VALUES (?, ?, ?, ?, ?)",
        values
      );
      const id = newReview.insertId;
      response
        .status(201)
        .location("/review/" + id.toString())
        .json();
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      } else {
        console.error(error.status);
        response.status(500).json([DATABASE_ERROR_MESSAGE]);
      }
    }
  }
}

export async function updateReviewById(request, response) {
  const errorMessages = getErrorMessagesForReview(
    request.body.updatedDescription,
    parseInt(request.body.updatedStars)
  );
  if (!errorMessages.length == 0) {
    response.status(400).json(errorMessages);
    return;
  } else {
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

      if (decodedToken.accountID !== request.body.accountID) {
        response.status(401).json([UNAUTHORIZED_USER_ERROR]);
        return;
      }

      const values = [
        request.body.updatedDescription,
        request.body.updatedStars.toString(),
        request.params.id,
      ];
      const updatedReview = await db.query(
        "UPDATE reviews SET description = ?, stars = ? WHERE reviewID = ?",
        values
      );
      response.status(200).send("Review updated successfully");
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        response.status(401).json([UNAUTHORIZED_USER_ERROR]);
      } else {
        console.error(error.status);
        response.status(500).json([DATABASE_ERROR_MESSAGE]);
      }
    }
  }
}

export async function deleteReviewById(request, response) {
  try {
    const authorizationHeaderValue = request.get("Authorization");
    const accessToken = authorizationHeaderValue.substring(7);
    const decodedToken = jwt.verify(accessToken, ACCESS_TOKEN_SECRET);

    if (!decodedToken.isAdmin) {
      throw new jwt.JsonWebTokenError();
    }

    await db.query("DELETE FROM reviews WHERE reviewID = ?", [request.params.id]);
    response.status(204).send("Review deleted successfully");
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      response.status(401).json([UNAUTHORIZED_USER_ERROR]);
    } else {
      console.error(error.status);
      response.status(500).json([DATABASE_ERROR_MESSAGE]);
    }
  }
}
