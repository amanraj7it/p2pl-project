from flask import Flask, request, jsonify #type: ignore
from flask_cors import CORS #type: ignore
import json
import os
import random
import time
from threading import Timer
import string

try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

app = Flask(__name__)
CORS(app)

DB_FILE = os.path.join(os.path.dirname(__file__), 'database.json')

def load_db():
    if os.path.exists(DB_FILE):
        try:
            with open(DB_FILE, 'r') as f:
                return json.load(f)
        except:
            pass
    return {"users": [], "donations": []}

def save_db(db):
    try:
        with open(DB_FILE, 'w') as f:
            json.dump(db, f, indent=2)
    except Exception as e:
        print("Error saving DB:", e)

otps = {}

def delete_otp(email):
    if email in otps:
        del otps[email]

import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText

def send_smtp_email(to_email, subject, body_text, smtp_server, smtp_port, sender_email, sender_pass, body_html=None):
    clean_pass = (sender_pass or '').replace(' ', '').strip()

    msg = MIMEMultipart('alternative') if body_html else MIMEMultipart()
    msg['Subject'] = subject
    msg['From'] = f"Food Wastage Reduction <{sender_email}>"
    msg['To'] = to_email

    msg.attach(MIMEText(body_text, 'plain', 'utf-8'))
    if body_html:
        msg.attach(MIMEText(body_html, 'html', 'utf-8'))

    server = smtplib.SMTP(smtp_server, smtp_port, timeout=25)
    try:
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(sender_email, clean_pass)
        server.sendmail(sender_email, [to_email], msg.as_string())
    finally:
        server.quit()

send_raw_socket_email = send_smtp_email

@app.route('/api/send-otp', methods=['POST'])
def send_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    mode = data.get('mode')
    if not email:
        return jsonify({"error": "Email required"}), 400

    db = load_db()
    existing_user = next((u for u in db['users'] if u.get('email', '').strip().lower() == email.lower()), None)
    if mode == 'register' and existing_user:
        return jsonify({
            "ok": False,
            "error": f"Email is already registered as a {existing_user.get('role', 'user').upper()}. Each email is linked to one role. Please log in."
        }), 400
    if mode == 'forgot' and not existing_user:
        return jsonify({
            "ok": False,
            "error": "No account found with this email address. Please register first."
        }), 404

    otp_code = str(random.randint(1000, 9999))
    otps[email] = otp_code

    # Set it to expire in 10 mins (600s)
    Timer(600, delete_otp, args=(email,)).start()

    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com').strip()
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    sender_email = os.environ.get('SMTP_EMAIL', 'amanbrilliant7@gmail.com').strip()
    sender_pass = os.environ.get('SMTP_PASS', 'xsbf euyc tapq qkfu').strip()

    if not sender_email or not sender_pass:
        return jsonify({
            "ok": False,
            "error": "Email service is not configured. Please contact the administrator."
        }), 503

    subject = 'Food Wastage Reduction - Your Verification Code'
    body = f"Your Food Wastage Reduction verification code is: {otp_code}\n\nThis code will expire in 10 minutes."
    body_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Your Food Wastage Reduction verification code</title>
</head>
<body style="margin:0;background:#f7f5ee;color:#344234;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:640px;margin:0 auto;background:#fffdf8;border:1px solid #d8e2d0;">
        <div style="padding:24px 32px 20px;display:flex;align-items:center;justify-content:space-between;">
            <div style="font-size:20px;font-weight:700;letter-spacing:-.3px;">
                <span style="display:inline-block;width:30px;height:30px;line-height:30px;text-align:center;margin-right:8px;border-radius:50%;background:#e3efdf;color:#4c7743;">⌁</span>
                Food Wastage Reduction
            </div>
            <div style="font-size:12px;color:#6d9d5c;">✦ Saving food, one meal at a time</div>
        </div>
        <div style="margin:0 32px;height:180px;border-radius:16px;background:#f0dfbc;overflow:hidden;text-align:center;">
            <div style="font-size:86px;line-height:180px;letter-spacing:8px;">🍎 🥖 🥕 🥦</div>
        </div>
        <div style="padding:24px 40px 28px;">
            <h1 style="margin:0 0 18px;font-size:22px;color:#344234;">Hi Food Saver 👋</h1>
            <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#71806e;">Here’s your verification code to join the fight against food waste:</p>
            <div style="padding:18px 16px 16px;border:1px solid #d9e4d3;border-radius:16px;background:#fff;box-shadow:0 5px 14px rgba(71,93,61,.08);text-align:center;">
                <div style="font-size:30px;font-weight:700;letter-spacing:12px;color:#609050;">{otp_code}</div>
                <div style="display:inline-block;margin-top:10px;padding:5px 12px;border-radius:14px;background:#f6f1e8;color:#b16b2e;font-size:11px;">⌛ Code expires in 10 minutes</div>
            </div>
            <div style="margin-top:18px;padding:12px 14px;border:1px solid #d9e4d3;border-radius:12px;background:#f5f5ed;color:#63705f;font-size:12px;text-align:center;">Every verified account helps rescue ~2kg of food from going to waste 🌍</div>
            <p style="margin:18px 0 0;font-size:11px;line-height:1.6;color:#8c9688;">Please enter this code on the verification screen to activate your account. Never share this code with anyone.</p>
            <div style="margin-top:26px;padding:13px;border-radius:24px;background:#6ba253;color:#fff;text-align:center;font-size:13px;font-weight:700;">Go to Website</div>
        </div>
        <div style="padding:26px 32px 30px;border-top:1px solid #eee8dc;background:#faf8f1;text-align:center;color:#929a8d;font-size:10px;line-height:1.6;">
            Didn’t request this? You can safely ignore this email. Someone may have typed your email address by mistake.<br><br>
            <span style="font-size:18px;color:#536d4d;">◎ &nbsp; ● &nbsp; ◉</span><br><br>
            Food Wastage Reduction · Chennai, Sholinganallur<br>
            <u>Unsubscribe</u> &nbsp; · &nbsp; <u>Privacy Policy</u>
        </div>
    </div>
</body>
</html>'''
    try:
        send_smtp_email(email, subject, body, smtp_server, smtp_port, sender_email, sender_pass, body_html)
        print(f"[SMTP SUCCESS] Verification OTP sent successfully to {email}")
        return jsonify({"ok": True, "message": "OTP sent successfully to your email."})
    except Exception as e:
        print(f"[SMTP ERROR] Could not send OTP to {email}: {e}")
        return jsonify({
            "ok": False,
            "error": "We could not send the verification email. Please try again later."
        }), 502

@app.route('/api/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    password = data.get('password')
    
    db = load_db()
    user = next((u for u in db['users'] if u.get('email', '').strip().lower() == email.lower() and u.get('password') == password), None)

    if user:
        if user.get('status') == 'banned':
            return jsonify({"success": False, "message": "Your account has been banned by the Admin."})
        return jsonify({"success": True, "user": user})
    else:
        return jsonify({"success": False, "message": "Invalid email or password."})

def generate_id():
    # Simple base36 string mimicking Date.now().toString(36)
    timestamp = str(int(time.time() * 1000))
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=8)) + timestamp

@app.route('/api/verify-otp', methods=['POST'])
def verify_otp():
    data = request.get_json() or {}
    email = data.get('email', '').strip()
    code = data.get('code')
    name = data.get('name')
    password = data.get('password')
    role = data.get('role')

    if email not in otps:
        return jsonify({"success": False, "message": "OTP expired or not sent"})

    if otps.get(email) == str(code):
        del otps[email]

        db = load_db()
        existing_user = next((u for u in db['users'] if u.get('email', '').strip().lower() == email.lower()), None)
        
        if existing_user:
            return jsonify({
                "success": False,
                "message": f"Email already registered as {existing_user.get('role', 'user').upper()}. Please log in."
            }), 400

        import datetime
        user = {
            "id": generate_id(),
            "name": name,
            "email": email,
            "password": password,
            "role": role or 'donor',
            "status": "active",
            "createdAt": datetime.datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%S.000Z')
        }
        db['users'].append(user)
        save_db(db)

        return jsonify({"success": True, "user": user})
    
    return jsonify({"success": False, "message": "Incorrect OTP"})

@app.route('/api/reset-password', methods=['POST'])
def reset_password():
    data = request.get_json() or {}
    email = data.get('email')
    code = data.get('code')
    new_password = data.get('newPassword')

    if email not in otps:
        return jsonify({"success": False, "message": "OTP expired or not sent"})

    if otps.get(email) == str(code):
        del otps[email]

        db = load_db()
        user = next((u for u in db['users'] if u.get('email') == email), None)
        if user:
            user['password'] = new_password
            save_db(db)
            return jsonify({"success": True})
        else:
            return jsonify({"success": False, "message": "Account not found"})
            
    return jsonify({"success": False, "message": "Incorrect OTP"})

@app.route('/api/users', methods=['GET', 'POST'])
def handle_users():
    db = load_db()
    if request.method == 'GET':
        return jsonify({"value": json.dumps(db['users'])})
    elif request.method == 'POST':
        data = request.get_json() or {}
        try:
            db['users'] = json.loads(data.get('value', '[]'))
            save_db(db)
            return jsonify({"ok": True})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400

@app.route('/api/donations', methods=['GET', 'POST'])
def handle_donations():
    db = load_db()
    if request.method == 'GET':
        return jsonify({"value": json.dumps(db['donations'])})
    elif request.method == 'POST':
        data = request.get_json() or {}
        try:
            db['donations'] = json.loads(data.get('value', '[]'))
            save_db(db)
            return jsonify({"ok": True})
        except Exception as e:
            return jsonify({"ok": False, "error": str(e)}), 400

@app.route('/api/send-email', methods=['POST'])
def send_email():
    data = request.get_json() or {}
    to_email = data.get('to_email')
    subject = data.get('subject')
    body = data.get('body')

    if not to_email or not subject or not body:
        return jsonify({"error": "Missing required fields"}), 400

    smtp_server = os.environ.get('SMTP_SERVER', 'smtp.gmail.com').strip()
    smtp_port = int(os.environ.get('SMTP_PORT', '587'))
    sender_email = os.environ.get('SMTP_EMAIL', 'amanbrilliant7@gmail.com').strip()
    sender_pass = os.environ.get('SMTP_PASS', '').strip()

    is_dummy = not sender_pass or sender_pass.strip() in ('your_password', 'dummy', 'change_me')

    if not is_dummy:
        try:
            send_smtp_email(to_email, subject, body, smtp_server, smtp_port, sender_email, sender_pass)
            print(f"[SMTP SUCCESS] Generic email successfully sent to {to_email}")
            return jsonify({"ok": True})
        except Exception as e:
            print("==================================================================")
            print(f"[SMTP DELIVERY NOTICE] {e}")
            print(f"[DEV FALLBACK EMAIL] To: {to_email}\nSubject: {subject}\n{body}")
            print("==================================================================")
            return jsonify({"ok": True, "warning": "Email logged to console (SMTP delivery unavailable)"})
    else:
        print("===============================")
        print(f"[DUMMY MODE EMAIL] Sent to {to_email}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body}")
        print("===============================")
        return jsonify({"ok": True})

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 4321))
    print(f"Flask JSON Database server running on port {port}...")
    app.run(host='0.0.0.0', port=port, debug=True)
