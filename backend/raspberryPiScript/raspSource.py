import network
import socket
from machine import ADC, Pin, unique_id
import time
import urequests
import ujson

# ==== Wi-Fi настройки ====
# Copy wifi_config.example.py to wifi_config.py and fill in your values
from wifi_config import SSID, PASSWORD, SERVER_IP

# ==== Сървър настройки ====
SERVER_PORT = 3060
URL = f'http://{SERVER_IP}:{SERVER_PORT}/addNewValue'

# ==== Калибрационни стойности за MQ135 ====
CALIBRATION_CONSTANTS = {
    "MQ135": {
        "CO2": {"A": 110.47, "B": -2.862},
        "NH3": {"A": 116.6020682, "B": -2.769034857},
        "Benzene": {"A": 102.2, "B": -2.473}
    }
}

# ==== Константи ====
VCC = 3.3
R0 = 10000.0  # kΩ (предполагаемо, може да се калибрира)
LED_PIN = 15  # Sharp GP2Y1010AU0F

# ==== Wi-Fi свързване ====
def connect_to_wifi(ssid, password):
    wlan = network.WLAN(network.STA_IF)
    wlan.active(True)
    wlan.connect(ssid, password)
    while not wlan.isconnected():
        print("Connecting to Wi-Fi...")
        time.sleep(1)
    print("Connected to Wi-Fi:", wlan.ifconfig())
    return wlan

# ==== Външна IP и локация ====
def get_public_ip():
    try:
        response = urequests.get("http://httpbin.org/ip")
        ip = response.json().get("origin")
        response.close()
        return ip
    except:
        return None

def get_location(ip):
    try:
        response = urequests.get(f"http://ipinfo.io/{ip}/json")
        loc = response.json().get("city", "Unknown")
        response.close()
        return loc
    except:
        return "Unknown"

# ==== Пресмятане на концентрации от MQ135 ====
def calculate_gas_concentration(analog_val, gas, sensor_type):
    try:
        voltage = analog_val * (VCC / 65535)
        Rs = ((VCC - voltage) * R0) / voltage
        ratio = Rs / R0

        A = CALIBRATION_CONSTANTS[sensor_type][gas]["A"]
        B = CALIBRATION_CONSTANTS[sensor_type][gas]["B"]
        ppm = A * (ratio ** B)
        return max(0.0, ppm)
    except Exception as e:
        print(f"Error in gas calculation ({gas}):", e)
        return 0.0

# ==== Прочитане от Sharp прахов сензор ====
def read_dust_sensor(led_pin, adc_pin):
    led_pin.value(1)
    time.sleep_us(280)
    analog_value = adc_pin.read_u16()
    time.sleep_us(40)
    led_pin.value(0)
    time.sleep_us(9680)

    voltage = analog_value * (5 / 65535)
    V_offset = 0.1  # 0.9V от datasheet
    K = 0.17  # μg/m³ per Volt, ≈ 2.0 sensitivity
    concentration = max(0.0, (voltage - V_offset) * K)
    return round(concentration * 1000, 2)

# ==== Основна програма ====
def main():
    wlan = connect_to_wifi(SSID, PASSWORD)
    ip = get_public_ip()
    city = get_location(ip)
    uid = ''.join('{:02x}'.format(b) for b in unique_id())

    # Настройки на пинове
    mq135_adc = ADC(Pin(26))
    dust_adc = ADC(Pin(27))
    led_dust = Pin(LED_PIN, Pin.OUT)

    while True:
        timestamp = int(time.time())
        air_data = {}

        analog_val = mq135_adc.read_u16()

        for gas in CALIBRATION_CONSTANTS["MQ135"]:
            ppm = calculate_gas_concentration(analog_val, gas, "MQ135")
            air_data[gas] = round(ppm, 2)

        dust = read_dust_sensor(led_dust, dust_adc)
        air_data["Dust"] = dust

        print("Измервания:", air_data)

        payload = {
            "timestamp": timestamp,
            "airData": air_data,
            "sensorName": uid,
            "city": city
        }

        try:
            response = urequests.post(URL, data=ujson.dumps(payload),
                                      headers={"Content-Type": "application/json"})
            print("Сървър:", response.text)
            response.close()
        except Exception as e:
            print("HTTP грешка:", e)

        time.sleep(30)

main()

