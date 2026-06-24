import argparse
import json
import urllib.error
import urllib.request
from urllib.parse import urlencode

NASA_API_BASE_URL = "https://api.nasa.gov/planetary/apod"
ELLANAN_API_BASE_URL = "https://apod.ellanan.com/api"


def fetch_data(url):
    """Fetches JSON data from a given URL."""
    try:
        req = urllib.request.Request(
            url, headers={"User-Agent": "APOD-Testing-Script/1.0"}
        )
        with urllib.request.urlopen(req) as response:
            data = json.loads(response.read().decode())
            return data, response.getcode()
    except urllib.error.HTTPError as e:
        try:
            error_data = json.loads(e.read().decode())
        except Exception:
            error_data = str(e)
        return error_data, e.code
    except urllib.error.URLError as e:
        return str(e.reason), None
    except Exception as e:
        return str(e), None


def main():
    parser = argparse.ArgumentParser(
        description="Compare NASA APOD API with Ellanan APOD API."
    )
    parser.add_argument(
        "-d",
        "--date",
        type=str,
        help="Specific date to retrieve (YYYY-MM-DD format). Defaults to the latest APOD if not provided.",
    )
    parser.add_argument(
        "-k",
        "--api-key",
        type=str,
        default="DEMO_KEY",
        help="API key for NASA API. Defaults to DEMO_KEY.",
    )

    args = parser.parse_args()

    nasa_params = {"api_key": args.api_key}
    ellanan_params = {}

    if args.date:
        nasa_params["date"] = args.date
        ellanan_params["date"] = args.date

    nasa_url = f"{NASA_API_BASE_URL}?{urlencode(nasa_params)}"
    ellanan_url = (
        f"{ELLANAN_API_BASE_URL}?{urlencode(ellanan_params)}"
        if ellanan_params
        else ELLANAN_API_BASE_URL
    )

    print(f"{'='*60}")
    print(f" Fetching from NASA API ")
    print(f"{'='*60}")
    # Hide API key in printed URL if not default DEMO_KEY
    display_nasa_url = (
        nasa_url
        if args.api_key == "DEMO_KEY"
        else nasa_url.replace(args.api_key, "***")
    )
    print(f"URL: {display_nasa_url}")

    nasa_data, nasa_status = fetch_data(nasa_url)
    print(f"Status Code: {nasa_status}")
    print("\nResponse:")
    print(json.dumps(nasa_data, indent=2))

    print(f"\n{'='*60}")
    print(f" Fetching from Ellanan API ")
    print(f"{'='*60}")
    print(f"URL: {ellanan_url}")

    ellanan_data, ellanan_status = fetch_data(ellanan_url)
    print(f"Status Code: {ellanan_status}")
    print("\nResponse:")
    print(json.dumps(ellanan_data, indent=2))
    print(f"\n{'='*60}")


if __name__ == "__main__":
    main()
