import requests
import json

def test_streaming():
    url = "http://localhost:8000/api/chat"
    payload = {
        "message": "Write a short poem about the moon.",
        "stream": True
    }
    
    print(f"Sending request to {url}...")
    try:
        response = requests.post(url, json=payload, stream=True)
        response.raise_for_status()
        
        print("Receiving stream:")
        for line in response.iter_lines():
            if line:
                line_str = line.decode('utf-8')
                if line_str.startswith("data: "):
                    data = json.loads(line_str[6:])
                    if "text" in data:
                        print(data["text"], end="", flush=True)
                    elif "error" in data:
                        print(f"\nError received in stream: {data['error']}")
        print("\n\nStream completed successfully.")
    except Exception as e:
        print(f"\nFailed to connect or process stream: {e}")

if __name__ == "__main__":
    test_streaming()
