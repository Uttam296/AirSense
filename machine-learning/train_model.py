import pandas as pd
import joblib

from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score


# Load Dataset
df = pd.read_csv("dataset/global_air_quality_2014_2025.csv")
df = df.sample(

    n=50000,

    random_state=42

)


print(df.head())

print(df.columns)


# Select Features

features = [

    "PM2.5 (ug/m3)",
    "PM10 (ug/m3)",
    "NO2 (ug/m3)",
    "CO (mg/m3)",
    "SO2 (ug/m3)",
    "O3 (ug/m3)"

]

target = "AQI"


# Remove Missing Values

df = df.dropna(subset=features + [target])


# Input and Output

X = df[features]

y = df[target]


# Train Test Split

X_train, X_test, y_train, y_test = train_test_split(

    X,
    y,

    test_size=0.2,

    random_state=42

)


# Train Model

model = RandomForestRegressor(

    n_estimators=50,

    random_state=42

)

model.fit(

    X_train,

    y_train

)


# Prediction

predictions = model.predict(

    X_test

)


# Accuracy

print()

print("R2 Score :", r2_score(y_test, predictions))

print("MAE :", mean_absolute_error(y_test, predictions))


# Save Model

joblib.dump(

    model,

    "model.pkl"

)

print()

print("Model Saved Successfully")