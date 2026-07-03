import sys
import joblib
import numpy as np
import os
import pandas as pd

# Get current file directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Load model using absolute path
model_path = os.path.join(current_dir, "model.pkl")

model = joblib.load(model_path)

# Read values from command line
pm25 = float(sys.argv[1])
pm10 = float(sys.argv[2])
no2 = float(sys.argv[3])
co = float(sys.argv[4])
so2 = float(sys.argv[5])
o3 = float(sys.argv[6])

# Create input array
input_data = pd.DataFrame({

    "PM2.5 (ug/m3)": [pm25],
    "PM10 (ug/m3)": [pm10],
    "NO2 (ug/m3)": [no2],
    "CO (mg/m3)": [co],
    "SO2 (ug/m3)": [so2],
    "O3 (ug/m3)": [o3]

})

# Predict AQI
prediction = model.predict(input_data)

print(round(prediction[0], 2))