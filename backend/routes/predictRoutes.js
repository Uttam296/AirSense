const express = require("express");

const { exec } = require("child_process");

const path = require("path");

const router = express.Router();

router.get("/", (req, res) => {

    const {

        pm25,

        pm10,

        no2,

        co,

        so2,

        o3

    } = req.query;

    const scriptPath = path.join(

        __dirname,

        "../../machine-learning/predict.py"

    );

    const command =

        `python "${scriptPath}" ${pm25} ${pm10} ${no2} ${co} ${so2} ${o3}`;

    exec(command, (error, stdout, stderr) => {

        if (error) {

            console.log(error);

            return res.status(500).json({

                error: error.message

            });

        }

        if (stderr) {

            return res.status(500).json({

                error: stderr

            });

        }

        res.json({

            predictedAQI: Number(stdout.trim())

        });

    });

});

module.exports = router;