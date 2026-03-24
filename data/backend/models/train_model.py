import os
import sys
import json
import random
import numpy as np
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
from xgboost import XGBClassifier
import joblib
from sklearn.preprocessing import MinMaxScaler

PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent

# Exact poses matching classifier_service.py
POSES = [
    'mountain', 'cat-cow', 'child-pose', 'warrior-1', 'warrior-2', 
    'bridge', 'downward-dog', 'seated-forward-bend', 'supine-twist', 'pigeon'
]

# Trimester safety rules for synthetic data
SUPINE_POSES = {'bridge', 'supine-twist'}
HIGH_EXERTION_POSES = {'warrior-1', 'warrior-2', 'downward-dog', 'pigeon'}
GENTLE_POSES = {'mountain', 'cat-cow', 'child-pose', 'seated-forward-bend'}

def generate_synthetic_dataset(n_samples=1000):
    data = []
    for _ in range(n_samples):
        row = {
            'trimester': random.choice([1,2,3]),
            'weeks_pregnant': random.randint(1,42),
            'age': random.randint(18,45),
            'bmi': round(random.uniform(18.5, 35.0), 2),
            'heart_rate': random.randint(60, 110),
            'has_hypertension': random.choice([False, True]) if random.random() < 0.1 else False,
            'has_diabetes': random.choice([False, True]) if random.random() < 0.08 else False,
            'pose_name': random.choice(POSES)
        }
        # Apply trimester-aware safety rules
        t = row['trimester']
        pose = row['pose_name']
        hypertension = row['has_hypertension']
        
        if t == 3 and pose in SUPINE_POSES:
            label = 'unsafe'
        elif t == 3 and pose in HIGH_EXERTION_POSES:
            label = random.choice(['modify', 'unsafe']) if random.random() < 0.3 else 'modify'
        elif hypertension and pose in HIGH_EXERTION_POSES:
            label = random.choice(['unsafe', 'modify']) if random.random() < 0.4 else 'unsafe'
        elif pose in GENTLE_POSES:
            label = 'safe'
        else:
            label = random.choice(['safe', 'modify']) if random.random() < 0.2 else 'safe'
        
        row['pose_label'] = label
        data.append(row)
    
    df = pd.DataFrame(data)
    csv_path = PROJECT_ROOT / 'data' / 'synthetic_yoga_safety.csv'
    df.to_csv(csv_path, index=False)
    print(f"Generated {len(df)} samples → {csv_path}")
    print(df['pose_label'].value_counts())
    return df

def prepare_features(df):
    # Numeric features scaler matching preprocessing.py bounds-ish
    numeric_features = ['trimester', 'weeks_pregnant', 'age', 'bmi', 'heart_rate']
    categorical_features = ['has_hypertension', 'has_diabetes', 'pose_name']
    
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', MinMaxScaler(), numeric_features),
            ('cat', OneHotEncoder(sparse_output=False, handle_unknown='ignore'), categorical_features)
        ])
    
    X = df[numeric_features + ['has_hypertension', 'has_diabetes', 'pose_name']]
    y = df['pose_label']
    
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    
    return preprocessor, X, y_encoded, le

def train_model():
    print("Step 1: Generating synthetic dataset...")
    df = generate_synthetic_dataset(1000)
    
    print("\nStep 2: Preparing features...")
    preprocessor, X, y, label_encoder = prepare_features(df)
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)
    
    print("\nStep 3: Training XGBoost pipeline...")
    model = XGBClassifier(n_estimators=100, max_depth=6, learning_rate=0.1, random_state=42, eval_metric='mlogloss')
    pipeline = Pipeline([
        ('preprocessor', preprocessor),
        ('classifier', model)
    ])
    
    pipeline.fit(X_train, y_train)
    
    print("\nStep 4: Evaluating...")
    y_pred = pipeline.predict(X_test)
    accuracy = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {accuracy:.3f}")
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=label_encoder.classes_))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y_test, y_pred))
    
    # Save matching classifier_service.py loader
    model_path = PROJECT_ROOT / 'models' / 'pose_classifier.pkl'
    joblib.dump({
        'pipeline': pipeline,
        'label_encoder': label_encoder
    }, model_path)
    print(f"\n✅ Model saved: {model_path}")
    
    print("\nReady! Run `uvicorn app.main:app --reload` to test /api/classify")

if __name__ == "__main__":
    train_model()

