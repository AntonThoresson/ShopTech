import express, { json } from 'express'
import faqRouter from "./routers/faq-router.js";
import advertRouter from "./routers/advert-router.js";
import jwt from "jsonwebtoken"
import db from './database-operations/db.js';

const ACCESS_TOKEN_SECRET = "83hrb4gruyeiw24kdwe7"



const app = express();
app.use(express.json());

app.use(function(request, response, next){

	response.set("Access-Control-Allow-Origin", "*")
	response.set("Access-Control-Allow-Methods", "*")
	response.set("Access-Control-Allow-Headers", "*")
	response.set("Access-Control-Expose-Headers", "*")

	next()
})

app.use("/faq", faqRouter);
app.use("/", advertRouter);


app.post("/tokens", function(request, response){

	const grantType = request.body.grant_type
	const username = request.body.username
	const password = request.body.password

	if(grantType != "password"){
		response.status(400).json({error: "unsupported_grant_type"})
		return
	}


	if(username == "testtest" && password == "testtest"){

		const payload = {
			isLoggedIn: true, 
		}

		jwt.sign(payload, ACCESS_TOKEN_SECRET, function(error, accessToken){

			if(error){
				response.status(500).end()
			} else {
				response.status(200).json({
					access_token: accessToken,
					type: "bearer", 
				})
			}
		})

	} else {

		response.status(400).json({error: "invalid_grant"})

	}
})

app.post("/signup", async function(request, response){

	console.log("Creating account")

	const accountData = request.body
	try {
		const values = [accountData.email, accountData.password, accountData.firstName, accountData.lastName, accountData.phoneNumber];
		const newAdvert = await db.query("INSERT INTO accounts (email, password, firstName, lastName, phoneNumber) VALUES (?,?,?,?,?)", values);
		response.status(201).send("Account created successfully").json();
		console.log("success")
	} catch (error) {
		console.error(error);
		console.log("fail bro")
		response.status(500).send("Internal server error");
	}
})


app.listen(8080, () => console.log("Server started"));





