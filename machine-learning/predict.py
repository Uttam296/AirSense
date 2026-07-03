import sys
import joblib
import numpy as np

# Load trained model
model = joblib.load("model.pkl")

# Read values from command line
pm25 = float(sys.argv[1])
pm10 = float(sys.argv[2])
no2 = float(sys.argv[3])
co = float(sys.argv[4])
so2 = float(sys.argv[5])
o3 = float(sys.argv[6])

# Create input array
input_data = np.array([[

    pm25,

    pm10,

    no2,

    co,

    so2,

    o3

]])

# Predict AQI
prediction = model.predict(input_data)

print(round(prediction[0], 2))