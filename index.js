const express = require("express");
const venom = require("venom-bot");

const fs = require("fs");
const fsPromises = require("fs").promises;


const { upload } = require("./middleware/multer.middleware");
const path = require("path");

const app = express();

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(express.static("uploads"));

let client;

app.get("/ping", (req,res)=>{
  res.send("server is working")
})

app.get("/login", async (req, res) => {
  if (!client) {
    try {
      client = await venom.create(
        "session",
        (base64Qr, asciiQR, attempts, urlCode) => {
          res.status(201).send({ base64Qr, asciiQR, attempts, urlCode });
        },
        (status) => {
          console.log(status);
        },
        {
          headless: "new",
          autoClose: false,
          useChrome: false,
          browserArgs: [
            "--no-sandbox",
            "--disable-setuid-sandbox",
            "--disable-dev-shm-usage",
            "--disable-accelerated-2d-canvas",
            "--no-first-run",
            "--no-zygote",
            "--single-process",
            "--disable-gpu",
          ],
          puppeteerOptions: {
            args: ["--no-sandbox", "--disable-setuid-sandbox"],
          },
        }
      );
    } catch (error) {
      res.status(500).send("Error while creating the client.");
    }
  } else {
    res.status(200).send("You are Logged in");
  }
});

// ! all routes - image , message , document
app.post("/send", upload.single("file"), async (req, res) => {

  let { number, message } = req.body;
  if (!number.endsWith("@c.us")) {
    number = `${number}@c.us`;
  }
  const file = req.file;

  try {
    if (file) {
      const ext = path.extname(file.originalname).toLowerCase();
      if (!fs.existsSync(file.path)) {
        throw new Error(`File not found at path: ${file.path}`);
      }
      //for image check
      if ([".jpg", ".jpeg", ".png", ".gif"].includes(ext)) {
        await client.sendImage(number, file.path, file.originalname, message);
        fs.unlinkSync(file.path); 
        res.send(`Image sent to ${number}`);
      } 
      // for document check
      else if ([".pdf", ".doc", ".docx", ".xls", ".xlsx"].includes(ext)) {
        await client.sendFile(number, file.path, file.originalname, message);
        fs.unlinkSync(file.path); 
        res.send(`Document sent to ${number}`);
      } 
      // for any unsupported file type
      else {
        res.status(400).send("Unsupported file type");
      }
    } 
    // if only message is provided
    else {
      await client.sendText(number, message);
      res.send(`Message sent to ${number}: ${message}`);
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
});









































// app.get("/logout", async (req, res) => {
//     fsPromises.rm("./tokens" , {recursive : true , force : true});
//     res.send("Logged out");
// })


// app.post("/send/message", async (req, res) => {
    //   try {
        //     let { number, message } = req.body;
        
        //     if (!number.endsWith("@c.us")) {
            //       number = `${number}@c.us`;
//     }

//     if (!client) {
//       return res.status(400).send("Client not initialized");
//     }

//     await client.sendText(number, message);

//     res.send(`Message sent to ${number}: ${message}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// app.post("/send/document", upload.single("document"), async (req, res) => {
//   try {
//     let { number, message } = req.body;

//     if (!number.endsWith("@c.us")) {
//       number = `${number}@c.us`;
//     }
//     const document = req.file;

//     if (!client) {
//       return res.status(400).send("Client not initialized");
//     }

//     if (!fs.existsSync(document.path)) {
//       throw new Error(`File not found at path: ${document.path}`);
//     }

//     await client.sendFile(
//       number,
//       document.path,
//       document.originalname,
//       message
//     );

//     res.send(`Document sent to ${number}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// // ! not in use
// app.post("/send/image", upload.single("image"), async (req, res) => {
//   try {
//     let { number, message } = req.body;
//     if (!number.endsWith("@c.us")) {
//       number = `${number}@c.us`;
//     }
//     const image = req.file;
//     if (!client) {
//       return res.status(400).send("Client not initialized");
//     }

//     if (!fs.existsSync(image.path)) {
//       throw new Error(`File not found at path: ${image.path}`);
//     }
//     await client.sendImage(number, image.path, image.originalname, message);
//     res.send(`Image sent to ${number}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// app.post("/send/video", upload.single("video"), async (req, res) => {
//   try {
//     const { number, message } = req.body;
//     if (!number.endsWith("@c.us")) {
//       number = `${number}@c.us`;
//     }
//     const video = req.file;

//     if (!client) {
//       return res.status(400).send("Client not initialized");
//     }

//     if (!fs.existsSync(video.path)) {
//       throw new Error(`File not found at path: ${video.path}`);
//     }

//     await client.sendFile(number, video.path, video.originalname, message);

//     res.send(`Video sent to ${number}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

// app.post("/send/audio", upload.single("audio"), async (req, res) => {
//   try {
//     const { number } = req.body;

//     if (!number.endsWith("@c.us")) {
//       number = `${number}@c.us`;
//     }
//     const audio = req.file;

//     if (!client) {
//       return res.status(400).send("Client not initialized");
//     }

//     if (!fs.existsSync(audio.path)) {
//       throw new Error(`File not found at path: ${audio.path}`);
//     }

//     await client.sendVoice(number, audio.path);

//     res.send(`Audio sent to ${number}`);
//   } catch (error) {
//     console.error(error);
//     res.status(500).send("Internal Server Error");
//   }
// });

const port = 3000;
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
