"""
Data Preprocessing Utilities for Rentverse
==========================================

This module contains the ImprovedDataPreprocessor class and related utilities
for preprocessing real estate rental data.
"""

import pandas as pd
import numpy as np
import re
from sklearn.base import BaseEstimator, TransformerMixin
from sklearn.preprocessing import LabelEncoder
from typing import Optional, List, Dict, Any
import logging

logger = logging.getLogger(__name__)


class ImprovedDataPreprocessor(BaseEstimator, TransformerMixin):
    """
    Simplified and robust data preprocessor for real estate data with aggressive outlier removal.

    This preprocessor handles:
    - Price and area cleaning/normalization
    - Location parsing (extracting region)
    - Outlier removal based on percentiles
    - Categorical encoding
    - Missing value handling

    Parameters:
    -----------
    remove_outliers : bool, default=True
        Whether to remove outliers based on percentiles
    price_percentile : int, default=90
        Percentile threshold for price outlier removal
    area_percentile : int, default=95
        Percentile threshold for area outlier removal
    target_column : str, default='price'
        Name of the target column
    verbose : bool, default=True
        Whether to print processing information
    """

    def __init__(
        self,
        remove_outliers: bool = True,
        price_percentile: int = 90,
        area_percentile: int = 95,
        target_column: str = 'price',
        verbose: bool = True
    ):
        self.label_encoders = {}
        self.feature_names = []
        self.target_column = target_column
        self.remove_outliers = remove_outliers
        self.price_percentile = price_percentile
        self.area_percentile = area_percentile
        self.price_upper_bound = None
        self.area_upper_bound = None
        self.verbose = verbose

    def _clean_price(self, price_str: Any) -> float:
        """
        Clean price column - remove RM, commas, currency symbols, etc.

        Parameters:
        -----------
        price_str : Any
            Raw price string or number

        Returns:
        --------
        float : Cleaned price value or NaN
        """
        if pd.isna(price_str):
            return np.nan
        try:
            # Remove everything except digits and decimal points
            cleaned = re.sub(r'[^\d.]', '', str(price_str))
            return float(cleaned) if cleaned else np.nan
        except Exception as e:
            if self.verbose:
                logger.warning(f"Error cleaning price '{price_str}': {e}")
            return np.nan

    def _clean_area(self, area_str: Any) -> float:
        """
        Clean area column - extract numeric value from area strings.

        Parameters:
        -----------
        area_str : Any
            Raw area string or number

        Returns:
        --------
        float : Cleaned area value or NaN
        """
        if pd.isna(area_str):
            return np.nan
        try:
            # Remove text and extract first number found
            cleaned = re.sub(r'[^\d.]', '', str(area_str))
            return float(cleaned) if cleaned else np.nan
        except Exception as e:
            if self.verbose:
                logger.warning(f"Error cleaning area '{area_str}': {e}")
            return np.nan

    def _parse_location(self, location_str: Any) -> str:
        """
        Extract region from location string - simplified to region only.

        Parameters:
        -----------
        location_str : Any
            Raw location string

        Returns:
        --------
        str : Extracted region or 'unknown'
        """
        if pd.isna(location_str):
            return "unknown"
        try:
            # Take the last part as region (most general location)
            parts = str(location_str).split(', ')
            if len(parts) >= 1:
                # Get the last part which is typically the state/region
                region = parts[-1].strip().lower()
                # Clean and standardize region names
                region = re.sub(r'[^\w\s]', '', region)  # Remove special characters
                return region if region else "unknown"
            else:
                return "unknown"
        except Exception as e:
            if self.verbose:
                logger.warning(f"Error parsing location '{location_str}': {e}")
            return "unknown"

    def _remove_outliers(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Remove outliers based on percentiles - aggressive approach.

        Parameters:
        -----------
        df : pd.DataFrame
            Input dataframe

        Returns:
        --------
        pd.DataFrame : Dataframe with outliers removed
        """
        if not self.remove_outliers:
            return df

        if self.verbose:
            print("🧹 Removing outliers with aggressive filtering...")
        original_size = len(df)

        # Remove price outliers - more stringent bounds
        if self.target_column in df.columns and self.price_upper_bound is not None:
            if self.verbose:
                print(f"   - Before price outlier removal: {len(df):,} samples")
            # More stringent price bounds
            df = df[df[self.target_column] <= self.price_upper_bound]
            df = df[df[self.target_column] >= 500]  # Minimum reasonable price RM 500
            df = df[df[self.target_column] <= 8000] # Maximum reasonable price RM 8,000
            if self.verbose:
                print(f"   - After price outlier removal: {len(df):,} samples")

        # Remove area outliers - more stringent bounds
        if 'area' in df.columns and self.area_upper_bound is not None:
            if self.verbose:
                print(f"   - Before area outlier removal: {len(df):,} samples")
            # More stringent area bounds
            df = df[df['area'] <= self.area_upper_bound]
            df = df[df['area'] >= 200]  # Minimum reasonable area 200 sqft
            df = df[df['area'] <= 5000] # Maximum reasonable area 5,000 sqft
            if self.verbose:
                print(f"   - After area outlier removal: {len(df):,} samples")

        # Remove unrealistic bedroom/bathroom counts
        if 'bedrooms' in df.columns:
            df = df[df['bedrooms'] <= 6]   # Max 6 bedrooms (more realistic)
            df = df[df['bedrooms'] >= 0]   # Min 0 bedrooms (studio)

        if 'bathrooms' in df.columns:
            df = df[df['bathrooms'] <= 5]   # Max 5 bathrooms (more realistic)
            df = df[df['bathrooms'] >= 1]   # Min 1 bathroom

        removed_count = original_size - len(df)
        removal_pct = (removed_count / original_size) * 100

        if self.verbose:
            print(f"   - Removed {removed_count:,} outliers ({removal_pct:.1f}% of data)")
            print(f"   - Remaining samples: {len(df):,}")

        return df

    def fit(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> 'ImprovedDataPreprocessor':
        """
        Fit the preprocessor on training data.

        Parameters:
        -----------
        X : pd.DataFrame
            Input features
        y : pd.Series, optional
            Target values (not used)

        Returns:
        --------
        self : ImprovedDataPreprocessor
            Fitted preprocessor
        """
        if self.verbose:
            print("📊 Fitting preprocessor with aggressive outlier removal...")

        # Make a copy of the data
        df = X.copy()

        # 1. Clean target variable (price)
        if self.target_column in df.columns:
            df[self.target_column] = df[self.target_column].apply(self._clean_price)
            if self.verbose:
                price_min = df[self.target_column].min()
                price_max = df[self.target_column].max()
                print(f"   - Price range before cleaning: RM {price_min:,.0f} to RM {price_max:,.0f}")

        # 2. Clean area column
        if 'area' in df.columns:
            df['area'] = df['area'].apply(self._clean_area)
            if self.verbose:
                area_min = df['area'].min()
                area_max = df['area'].max()
                print(f"   - Area range before cleaning: {area_min:.0f} to {area_max:,.0f} sqft")

        # 3. Extract region from location - simplified approach
        if 'location' in df.columns:
            df['region'] = df['location'].apply(self._parse_location)

        # 4. Calculate outlier bounds before removal
        if self.remove_outliers:
            if self.target_column in df.columns:
                self.price_upper_bound = df[self.target_column].quantile(self.price_percentile / 100)
                if self.verbose:
                    print(f"   - Price upper bound (P{self.price_percentile}): RM {self.price_upper_bound:,.0f}")

            if 'area' in df.columns:
                self.area_upper_bound = df['area'].quantile(self.area_percentile / 100)
                if self.verbose:
                    print(f"   - Area upper bound (P{self.area_percentile}): {self.area_upper_bound:,.0f} sqft")

        # 5. Remove outliers
        df = self._remove_outliers(df)

        # Show final ranges after outlier removal
        if self.verbose:
            if self.target_column in df.columns:
                price_min = df[self.target_column].min()
                price_max = df[self.target_column].max()
                print(f"   - Final price range: RM {price_min:,.0f} to RM {price_max:,.0f}")
            if 'area' in df.columns:
                area_min = df['area'].min()
                area_max = df['area'].max()
                print(f"   - Final area range: {area_min:.0f} to {area_max:,.0f} sqft")

        # 6. Ensure proper data types for categorical columns
        categorical_columns = ['property_type', 'furnished', 'region']

        for col in categorical_columns:
            if col in df.columns:
                # Fill missing values with 'unknown'
                df[col] = df[col].fillna('unknown').astype(str)

                # Fit label encoder
                self.label_encoders[col] = LabelEncoder()
                self.label_encoders[col].fit(df[col])

                if self.verbose:
                    n_categories = len(self.label_encoders[col].classes_)
                    print(f"   - {col}: {n_categories} categories")

        # 7. Store feature names (excluding target and original location)
        self.feature_names = [col for col in ['property_type', 'bedrooms', 'bathrooms',
                                            'area', 'furnished', 'region']
                             if col in df.columns]

        if self.verbose:
            print(f"   - Features selected: {self.feature_names}")

        return self

    def transform(self, X: pd.DataFrame, y: Optional[pd.Series] = None) -> pd.DataFrame:
        """
        Transform the data using fitted preprocessor.

        Parameters:
        -----------
        X : pd.DataFrame
            Input features
        y : pd.Series, optional
            Target values (not used)

        Returns:
        --------
        pd.DataFrame : Transformed data
        """
        # Handle backward compatibility with pickled models that don't have verbose attribute
        verbose = getattr(self, 'verbose', False)

        if verbose:
            print("🔄 Transforming data...")

        # Make a copy
        df = X.copy()

        # 1. Clean price if present
        if self.target_column in df.columns:
            df[self.target_column] = df[self.target_column].apply(self._clean_price)

        # 2. Clean area
        if 'area' in df.columns:
            df['area'] = df['area'].apply(self._clean_area)

        # 3. Extract region from location - simplified
        if 'location' in df.columns:
            df['region'] = df['location'].apply(self._parse_location)

        # 4. Remove outliers (only during training when target is present)
        if self.target_column in df.columns:  # This indicates training data
            df = self._remove_outliers(df)

        # 5. Encode categorical variables
        for col, encoder in self.label_encoders.items():
            if col in df.columns:
                # Fill missing values and ensure string type
                df[col] = df[col].fillna('unknown').astype(str)

                # Handle unknown categories
                mask = df[col].isin(encoder.classes_)
                df.loc[~mask, col] = 'unknown' if 'unknown' in encoder.classes_ else encoder.classes_[0]

                # Transform
                df[col] = encoder.transform(df[col])

        # 6. Select only the features we want
        columns_to_select = self.feature_names.copy()
        if self.target_column in df.columns:
            columns_to_select.append(self.target_column)

        result = df[columns_to_select].copy()

        # 7. Handle missing values
        # For numerical columns, fill with median
        numerical_cols = ['bedrooms', 'bathrooms', 'area']
        for col in numerical_cols:
            if col in result.columns:
                result[col] = pd.to_numeric(result[col], errors='coerce')
                median_val = result[col].median()
                result[col] = result[col].fillna(median_val)

        # 8. Remove rows with missing target variable (for training)
        if self.target_column in result.columns:
            result = result.dropna(subset=[self.target_column])

        # 9. Remove rows with too many missing features
        feature_cols = [col for col in self.feature_names if col in result.columns]
        result = result.dropna(subset=feature_cols)

        if verbose:
            print(f"   - Final shape: {result.shape}")
            feature_list = [col for col in result.columns if col != self.target_column]
            print(f"   - Features: {feature_list}")

        return result

    def get_feature_names(self) -> List[str]:
        """Get the list of feature names."""
        return self.feature_names.copy()

    def get_categorical_encoders(self) -> Dict[str, LabelEncoder]:
        """Get the fitted label encoders."""
        return self.label_encoders.copy()

    def get_outlier_bounds(self) -> Dict[str, float]:
        """Get the calculated outlier bounds."""
        bounds = {}
        if self.price_upper_bound is not None:
            bounds['price_upper_bound'] = self.price_upper_bound
        if self.area_upper_bound is not None:
            bounds['area_upper_bound'] = self.area_upper_bound
        return bounds


def create_preprocessor(
    remove_outliers: bool = True,
    price_percentile: int = 90,
    area_percentile: int = 95,
    verbose: bool = True
) -> ImprovedDataPreprocessor:
    """
    Factory function to create an ImprovedDataPreprocessor instance.

    Parameters:
    -----------
    remove_outliers : bool, default=True
        Whether to remove outliers
    price_percentile : int, default=90
        Price outlier threshold percentile
    area_percentile : int, default=95
        Area outlier threshold percentile
    verbose : bool, default=True
        Whether to print processing information

    Returns:
    --------
    ImprovedDataPreprocessor : Configured preprocessor instance
    """
    return ImprovedDataPreprocessor(
        remove_outliers=remove_outliers,
        price_percentile=price_percentile,
        area_percentile=area_percentile,
        verbose=verbose
    )


def preprocess_property_data(
    data: Dict[str, Any],
    preprocessor: ImprovedDataPreprocessor
) -> pd.DataFrame:
    """
    Convenience function to preprocess a single property data dictionary.

    Parameters:
    -----------
    data : Dict[str, Any]
        Property data dictionary
    preprocessor : ImprovedDataPreprocessor
        Fitted preprocessor instance

    Returns:
    --------
    pd.DataFrame : Preprocessed data ready for prediction
    """
    df = pd.DataFrame([data])
    return preprocessor.transform(df)


def validate_property_data(data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Validate and clean property data before preprocessing.

    Parameters:
    -----------
    data : Dict[str, Any]
        Property data dictionary

    Returns:
    --------
    Dict[str, Any] : Validated property data

    Raises:
    -------
    ValueError : If required fields are missing or invalid
    """
    required_fields = ['property_type', 'bedrooms', 'bathrooms', 'area', 'furnished', 'location']

    # Debug logging to see what data we're receiving
    logger.debug(f"Validating property data: {data}")
    logger.debug(f"Data keys: {list(data.keys())}")
    logger.debug(f"Required fields: {required_fields}")

    # Check required fields
    missing_fields = [field for field in required_fields if field not in data]
    if missing_fields:
        logger.error(f"Missing required fields: {missing_fields}")
        logger.error(f"Available fields: {list(data.keys())}")
        logger.error(f"Data content: {data}")
        raise ValueError(f"Missing required fields: {missing_fields}")

    # Validate data types and ranges
    validated_data = data.copy()

    try:
        # Ensure numeric fields are numbers
        validated_data['bedrooms'] = int(float(data['bedrooms']))
        validated_data['bathrooms'] = int(float(data['bathrooms']))
        validated_data['area'] = float(data['area'])

        # Validate ranges
        if validated_data['bedrooms'] < 0 or validated_data['bedrooms'] > 10:
            raise ValueError(f"Invalid bedrooms count: {validated_data['bedrooms']}")

        if validated_data['bathrooms'] < 0 or validated_data['bathrooms'] > 10:
            raise ValueError(f"Invalid bathrooms count: {validated_data['bathrooms']}")

        if validated_data['area'] <= 0 or validated_data['area'] > 10000:
            raise ValueError(f"Invalid area: {validated_data['area']}")

    except (ValueError, TypeError) as e:
        raise ValueError(f"Invalid numeric values in property data: {e}")

    # Ensure string fields are strings
    for field in ['property_type', 'furnished', 'location']:
        validated_data[field] = str(data[field]).strip()
        if not validated_data[field]:
            raise ValueError(f"Empty {field} field")

    return validated_data
