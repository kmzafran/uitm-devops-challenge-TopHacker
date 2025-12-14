"""
Command-line interface for RentVerse AI Service.
"""

import click
import uvicorn
from .config import get_settings


@click.group()
def cli():
    """RentVerse AI Service CLI."""
    pass


@cli.command()
@click.option("--host", default="0.0.0.0", help="Host to bind the server to")
@click.option("--port", default=8000, help="Port to bind the server to")
@click.option("--reload", is_flag=True, help="Enable auto-reload for development")
@click.option("--log-level", default="info", help="Log level")
def start(host: str, port: int, reload: bool, log_level: str):
    """Start the RentVerse AI Service."""
    click.echo(f"Starting RentVerse AI Service on {host}:{port}")

    uvicorn.run(
        "rentverse.main:app",
        host=host,
        port=port,
        reload=reload,
        log_level=log_level
    )


@cli.command()
@click.option("--host", default="0.0.0.0", help="Host to bind the server to")
@click.option("--port", default=8000, help="Port to bind the server to")
def dev(host: str, port: int):
    """Start the service in development mode with auto-reload."""
    click.echo(f"Starting RentVerse AI Service in development mode on {host}:{port}")

    uvicorn.run(
        "rentverse.main:app",
        host=host,
        port=port,
        reload=True,
        log_level="debug"
    )


@cli.command()
def test_model():
    """Test if the ML model can be loaded and make a prediction."""
    from .models.ml_models import get_model
    from .models.schemas import PropertyPredictionRequest

    try:
        click.echo("Loading model...")
        model = get_model()
        click.echo(f"✅ Model loaded successfully: {model.model_version}")

        # Test prediction
        click.echo("Testing prediction...")
        test_request = PropertyPredictionRequest(
            property_type="apartment",
            bedrooms=2,
            bathrooms=2.0,
            square_feet=1200,
            location="test_city"
        )

        result = model.predict(test_request)
        click.echo(f"✅ Test prediction successful: ${result.predicted_price:.2f}")
        click.echo(f"   Confidence: {result.confidence_score:.2%}")

    except Exception as e:
        click.echo(f"❌ Error: {e}")


if __name__ == "__main__":
    cli()
