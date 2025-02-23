from flask import Flask, request, jsonify
from flask_pymongo import PyMongo
from flask_bcrypt import Bcrypt
from flask_cors import CORS
from datetime import datetime, time, timedelta, timezone
import os
import pandas as pd
from apscheduler.schedulers.background import BackgroundScheduler
import pytz
from pymongo.errors import CollectionInvalid

app = Flask(__name__)

# MongoDB Configuration
app.config["MONGO_URI"] = "mongodb://localhost:27017/SJAttendance_System"
mongo = PyMongo(app)
bcrypt = Bcrypt(app)
CORS(app)


def serverStart():
    db = mongo.db
    if "Swap_details" not in db.list_collection_names():
        try:
            db.create_collection("Swap_details")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore

    if "attendance_records" not in db.list_collection_names():
        try:
            db.create_collection("attendance_records")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    
    if "edit_request" not in db.list_collection_names():
        try:
            db.create_collection("edit_request")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    
    if "extra_class_details" not in db.list_collection_names():
        try:
            db.create_collection("extra_class_details")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    
    if "faculty_domain" not in db.list_collection_names():
        try:
            db.create_collection("faculty_domain")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    
    if "students_data" not in db.list_collection_names():
        try:
            db.create_collection("students_data")  # Explicitly create the collection
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    

    if "users" not in db.list_collection_names():
        try:
            db.create_collection("users")
        except CollectionInvalid:
            pass  # Collection already exists due to concurrency, ignore
    
    print("server started")


def register():
    email = "mainadmin@gmail.com"
    empId = 1000
    name = "mainadmin"
    password = "MainAdmin@1000"


    # Check if user already exists
    existing_user = mongo.db.users.find_one({"$or": [{"email": email}, {"emp_id": empId}]})
    
    if existing_user:
        print("User already exists. Registration denied.")
    else:
        # Hash the password and insert the new user
        hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")
        mongo.db.users.insert_one({
            "email": email,
            "emp_id": empId,
            "name": name,
            "password": hashed_password,
            "role": "main_admin"
        })

    print("User registered successfully!")

serverStart()
register()



@app.route('/login', methods=['POST'])
def login():
    data = request.json
    email = data.get('email')
    password = data.get('password')
    
    if not email or not password:
        return jsonify({'message': 'Email and password are required'}), 400

    try:
        user = mongo.db.users.find_one({"email": email})
        if user and bcrypt.check_password_hash(user["password"], password):
            return jsonify({'message': 'Login successful', 'role': user['role'], 'emp_id': user['emp_id'], 'name': user['name']}), 200
        else:
            return jsonify({'message': 'Invalid email or password'}), 401
    except Exception as e:
        return jsonify({'message': 'Internal server error', 'error': str(e)}), 500
    

    
@app.route("/change-password", methods=["POST"])
def change_password():
    data = request.json
    email = data.get("email")
    new_password = data.get("new_password")

    if not email or not new_password:
        return jsonify({"error": "Email and new password are required"}), 400

    # Fetch user from MongoDB
    user = mongo.db.users.find_one({"email": email})
    if not user:
        return jsonify({"error": "User not found"}), 404

    # Hash the new password
    hashed_password = bcrypt.generate_password_hash(new_password).decode("utf-8")

    # Update password in MongoDB
    mongo.db.users.update_one({"email": email}, {"$set": {"password": hashed_password}})

    return jsonify({"message": "Password updated successfully"}), 200




@app.route("/class_details", methods=["GET"])
def get_class_details():
    emp_id = int(request.args.get("emp_id"))
    if not emp_id:
        return jsonify({"error": "Missing emp_id"}), 400
    


    regularcheck = list(mongo.db.faculty_domain.find({"emp_id": int(emp_id)}, {"_id": 0}))
    swapCheck = list(mongo.db.Swap_details.find({"emp_id": int(emp_id)}, {"_id": 0}))
    extraCheck = list(mongo.db.extra_class_details.find({"emp_id": int(emp_id)}, {"_id": 0}))
    
    regularcheck = regularcheck[0] if regularcheck else {}
    swapCheck = swapCheck[0] if swapCheck else {}
    extraCheck = extraCheck[0] if extraCheck else {}

    today_day = datetime.today().strftime('%A')
    current_time = datetime.now().time()
    today_date = datetime.today().strftime('%d-%m-%Y')
    cutoff_time = time(12, 30)
    
    regularDomainId = []
    swapDomainId = []
    extraDomainId = []

    attendance_record = mongo.db.attendance_records.find_one({"date": today_date})
    attendance_record = attendance_record if attendance_record else {}

    for cs in regularcheck.get("classes", []):
        for entry in attendance_record.get("attendance", []):
            if entry["domain_id"] == cs["domain_id"]:
                break
        else:
            if today_day in cs["days"]:
                regularDomainId.append(cs["domain_id"])
    
    for cs in swapCheck.get("classes", []):
        for entry in attendance_record.get("attendance", []):
            if entry["emp_id"] == emp_id and entry["domain_id"] == cs["domain_id"]:
                break
        else:
            if today_day == cs["day"] and today_date == cs["date"]:
                swapDomainId.append(cs["domain_id"])
    
    for cs in extraCheck.get("classes", []):
        for entry in attendance_record.get("attendance", []):
            if entry["emp_id"] == emp_id and entry["domain_id"] == cs["domain_id"]:
                break
        else:
            if today_date == cs["date"]:
                extraDomainId.append(cs["domain_id"])

    studentsData = []

    for dId in regularDomainId:
        data = list(mongo.db.students_data.find({"domain_id": dId}, {"_id": 0}))
        if data:
            data[0]["day"] = today_day
            data[0]["date"] = today_date
            data[0]["type"] = "Regular"
            data[0]["swap"] = False
            data[0]["enable"] = current_time < cutoff_time
            studentsData.append(data)

    for dId in swapDomainId:
        data = list(mongo.db.students_data.find({"domain_id": dId}, {"_id": 0}))
        if data:
            data[0]["day"] = today_day
            data[0]["date"] = today_date
            data[0]["type"] = "Swapped"
            data[0]["swap"] = True
            data[0]["enable"] = current_time < cutoff_time
            studentsData.append(data)

    for dId in extraDomainId:
        data = list(mongo.db.students_data.find({"domain_id": dId}, {"_id": 0}))
        if data:
            data[0]["day"] = today_day
            data[0]["date"] = today_date
            data[0]["type"] = "Extra Class"
            data[0]["swap"] = True
            data[0]["enable"] = True
            studentsData.append(data)

    if not studentsData:
        return jsonify([])

    responseData = []

    for data in studentsData:
        responseData.append(data[0])
    
    return jsonify(responseData)






@app.route("/students_details", methods=["GET"])
def get_students():
    domain_id = request.args.get("domain_id")

    if not domain_id:
        return jsonify({"error": "Missing domain"}), 400
    
    class_data = mongo.db.students_data.find_one({"domain_id": int(domain_id)}, {"_id": 0, "students": 1})

    if class_data:
        students = class_data.get("students", [])
        sorted_students = sorted(students, key=lambda x: x.get("REGISTER NUMBER", ""))
        return jsonify({"students": sorted_students})

    
    return jsonify({"error": "No students found"}), 404






@app.route("/submit_attendance", methods=["POST"])
def submit_attendance():
    data = request.json
    emp_id = int(data["emp_id"])
    data["emp_id"] = emp_id
    today_date = datetime.today().strftime('%d-%m-%Y') 

    if mongo.db.Swap_details.find({"emp_id": emp_id}):
        mongo.db.Swap_details.update_one({"emp_id": emp_id}, {"$pull": {"classes": {"domain_id": data["domain_id"]}}})

    existing_doc = mongo.db.attendance_records.find_one({"date": today_date})

    if existing_doc:
        mongo.db.attendance_records.update_one(
            {"date": today_date},
            {"$push": {"attendance": data}}
        )
        return jsonify({"message": "Attendance updated successfully"}), 200
    else:
        new_doc = {
            "date": today_date,
            "attendance": [data]
        }
        mongo.db.attendance_records.insert_one(new_doc)
        return jsonify({"message": "New attendance record created"}), 201
    





@app.route("/faculty_details", methods=["GET"])
def get_faculty_details():
    emp_id = request.args.get("exclude")
    
    faculties = list(mongo.db.Faculty_details.find(
        {"emp_id": {"$ne": emp_id}},
        {"_id": 0, "name": 1, "emp_id": 1}
    ))

    faculties = [{"name": "Manoj S", "emp_id": 101}, {"name": "Dr. Karthi", "emp_id": 102}, {"name": "Kalpana BN", "emp_id": 100}]
    responseData = []

    for dic in faculties:
        if dic["emp_id"] != int(emp_id):
            responseData.append(dic)

    return jsonify({"faculties": responseData})






@app.route("/swap_attendance", methods=["POST"])
def swap_attendance():
    data = request.json
    domain = data.get("domain")
    domain_id = data.get("domain_id")
    from_emp_id = data.get("from_emp_id")
    to_emp_id = data.get("to_emp_id")
    to_faculty_name = data.get("to_faculty_name")
    date = data.get("date")
    day = data.get("day")
    name = data.get("from_emp_name")

    if not all([domain, domain_id, from_emp_id, to_emp_id, to_faculty_name]):
        return jsonify({"error": "Missing required fields"}), 400

    swap_request = {
        "domain": domain,
        "domain_id": domain_id,
        "from_emp_id": int(from_emp_id),
        "from_emp_name": name,
        "status": "Pending",
        "date": date,
        "day": day
    }

    if mongo.db.Swap_details.find_one({"emp_id": to_emp_id, "classes": {"$elemMatch": {"domain_id": domain_id}}}):
        return jsonify({"message": "Already Swapped"}), 201

    mongo.db.Swap_details.update_one(
        {"emp_id": to_emp_id, "emp_name": to_faculty_name},
        {
            "$push": {
                "classes": swap_request
            }
        },
        upsert=True
    )

    return jsonify({"message": "Swap request submitted successfully"}), 201







@app.route("/extra_class_details", methods=["GET"])
def get_student_details():
    emp_id = request.args.get("emp_id", type=int)

    if not emp_id:
        return jsonify({"error": "emp_id is required"}), 400

    faculty = mongo.db.faculty_domain.find_one({"emp_id": emp_id}, {"_id": 0, "classes": 1})
    faculty["date"] = datetime.today().strftime('%d-%m-%Y')

    if not faculty:
        return jsonify({"error": "Faculty not found"}), 404

    return jsonify(faculty)






@app.route("/add_extra_class", methods=["POST"])
def add_extra_class():
    data = request.json

    # Check for required fields
    if not all(key in data for key in ["emp_id", "date", "start_time", "end_time", "domain_id", "domain"]):
        return jsonify({"error": "Missing data fields"}), 400
    

    extra_class = {
        "date": data["date"],
        "start_time": data["start_time"],
        "end_time": data["end_time"],
        "domain_id": data["domain_id"],
        "domain": data["domain"],
        "created_at": datetime.now(timezone.utc)
    }



    res = mongo.db.extra_class_details.update_one(
        {"emp_id": int(data["emp_id"]), "emp_name": data["name"]},
        {"$push": {"classes": extra_class}},
        upsert=True  # Ensure document is created if not found
    )

    # Check if the update or insert was successful
    if res.modified_count > 0 or res.upserted_id:
        return jsonify({"message": "Extra class added successfully"}), 200
    else:
        return jsonify({"error": "Failed to add extra class"}), 500
    





    
@app.route('/get_previous_attendance', methods=['POST'])
def get_attendance():
    data = request.json
    emp_id = int(data.get("emp_id"))

    if not emp_id:
        return jsonify({"error": "Employee ID is required"}), 400

    # Fetch faculty domain using emp_id
    faculty_domain = mongo.db.faculty_domain.find_one({"emp_id": emp_id})
    if not faculty_domain:
        return jsonify({"error": "Faculty not found"}), 404

    domain_ids = [cls["domain_id"] for cls in faculty_domain["classes"]]

    # Get today's date and time
    today_date = datetime.today()
    formatted_today = today_date.strftime("%d-%m-%Y")
    current_time = today_date.strftime("%H:%M")

    

    # Fetch attendance records for the last 3 days
    attendance_data = []
    for i in range(3):  # Fix: Checking last 3 days
        date_to_check = today_date - timedelta(days=i)
        formatted_date = date_to_check.strftime("%d-%m-%Y")
        # Fetch edit requests for today
        edit_requests = list(mongo.db.edit_request.find({
            "date": formatted_date,
            "emp_id": emp_id
        }))
        
        # Fetch attendance records for the specific date
        attendance_records = mongo.db.attendance_records.find_one({"date": formatted_date})
        
        if attendance_records:
            for att in attendance_records["attendance"]:
                if att["domain_id"] in domain_ids:
                    att["enable_edit"] = False  # Default to False
                    # Check if editing is allowed for this domain
                    for requestData in edit_requests:
                        if att["domain_id"] == requestData.get("domain_id"):
                            if current_time <= requestData["allow_until"] and requestData["status"] == "approved" and formatted_date == formatted_today:
                                att["enable_edit"] = True
                            else:
                                mongo.db.edit_request.delete_one({"date": formatted_date, "emp_id": emp_id, "domain_id": att["domain_id"]})
                       

                    att["date"] = formatted_date
                    attendance_data.append(att)
                    
    return jsonify(attendance_data) 


@app.route("/send_edit_request", methods=["POST"])
def send_edit_request():
    # Get the data from the request body (JSON)
    data = request.json
    emp_id = data.get("emp_id")
    emp_name = data.get("emp_name")
    domain_name = data.get("domain_name")
    domain_id = data.get("domain_id")
    message = data.get("message")
    today_date = datetime.today()
    formatted_date = today_date.strftime("%d-%m-%Y")

    # Check if the required fields are present
    if not emp_id or not domain_id:
        return jsonify({"error": "Missing data"}), 400

    # Create a new edit request document
    new_request = {
        "date": formatted_date,
        "emp_id": int(emp_id),
        "emp_name": emp_name,
        "domain_id": domain_id,
        "domain_name": domain_name,
        "message": message,
        "status": "pending"  # You can also include the status of the request
    }



    # Insert the document into the 'request_edit' collection
    try:
        inserted_id = mongo.db.edit_request.insert_one(new_request).inserted_id

        # Return success message with the inserted ID
        return jsonify({"success": "Edit request sent successfully!", "request_id": str(inserted_id)}), 200
    except Exception as e:
        return jsonify({"error": f"Failed to send edit request. Error: {str(e)}"}), 500
    





@app.route("/download_attendance", methods=["GET"])
def downloadAttendance():
    date = request.args.get("date")
    emp_id = int(request.args.get("emp_id"))
    
    if not date:
        return jsonify({"error": "Date is required"}), 400
    
    try:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        formatted_date = date_obj.strftime("%d-%m-%Y")
    except ValueError:
        return jsonify({"error": "Invalid date format"}), 400

    attendance_records = list(mongo.db.attendance_records.find({"date": formatted_date}))

    if not attendance_records:
        return jsonify({"attendance": {}})

    data = {}

    for record in attendance_records:
        if "attendance" in record:
            for clas in record["attendance"]:
                if "attendance" in clas:
                    for stu in clas["attendance"]:
                        if emp_id == 1000:
                            department = stu.get("department", "Unknown")
                            if department not in data:
                                data[department] = []
                            data[department].append(stu)
                        elif emp_id == 2000:
                            if stu.get("college_name") == "St. Joseph's College of Engineering":
                                department = stu.get("department", "Unknown")
                                if department not in data:
                                    data[department] = []
                                data[department].append(stu)
                        else:
                            if stu.get("college_name") == "St. Joseph's Institute of Technology":
                                department = stu.get("department", "Unknown")
                                if department not in data:
                                    data[department] = []
                                data[department].append(stu)

    for key, value in data.items():
        value.sort(key=lambda x: x.get("reg_no", ""))


    return jsonify({"attendance": data})







@app.route("/get_edit_requests", methods=["GET"])
def get_edit_requests():


    requests_collection = mongo.db.edit_request
    today_date = datetime.today()
    formatted_date = today_date.strftime("%d-%m-%Y")
    requests = requests_collection.find({"date": formatted_date, "status": "pending"})
    
    result = []
    for req in requests:
        result.append({
            "emp_id": req["emp_id"],
            "emp_name": req["emp_name"],
            "domain": req["domain_name"],
            "domain_id": req["domain_id"],
            "message": req["message"],
            "status": req["status"]
        })
    
    return jsonify(result)







@app.route("/approve_request", methods=["PUT"])
def approve_request():
    try:
        data = request.json
        emp_id = int(data.get("emp_id"))
        domain_id = int(data.get("domain_id"))
        allow_until = data.get("allow_until")
        today_date = datetime.today()
        formatted_date = today_date.strftime("%d-%m-%Y")

        if not emp_id or not domain_id or not allow_until:
            return jsonify({"error": "Missing required fields"}), 400

        # Convert allow_until (HH:MM) to proper datetime format
        approval_time = datetime.strptime(allow_until, "%H:%M").strftime("%H:%M")

        # Update request in MongoDB
        result = mongo.db.edit_request.update_one(
            {"date": formatted_date, "emp_id": emp_id, "domain_id": domain_id, "status": "pending"},
            {"$set": {"status": "approved", "allow_until": approval_time}}
        )

        if result.matched_count == 0:
            return jsonify({"error": "Request not found"}), 404

        return jsonify({"message": "Request approved successfully"}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500






@app.route("/update_attendance", methods=["POST"])
def update_attendance():
    data = request.json
    date = data.get("date")
    emp_id = int(data.get("emp_id"))
    name = data.get("name")
    domain = data.get("domain")
    domain_id = int(data.get("domain_id"))
    new_attendance = data.get("updated_attendance")

    mongo.db.attendance_records.update_one(
        {"date": date},
        {"$pull": {"attendance": {"domain_id": domain_id}}}
    )

    existing_doc = mongo.db.attendance_records.find_one({"date": date})

    newData = {"domain": domain, "domain_id":domain_id, "emp_id": emp_id, "name": name, "attendance": new_attendance}

    if existing_doc:
        mongo.db.attendance_records.update_one(
            {"date": date},
            {"$push": {"attendance": newData}}
        )
    else:
        new_doc = {
            "date": date,
            "attendance": [newData]
        }
        mongo.db.attendance_records.insert_one(new_doc)
    
    mongo.db.edit_request.delete_one({"date": date, "emp_id": emp_id, "domain_id": domain_id})

    

    return jsonify({"message": "Attendance updated successfully"}), 200







# Allowed file extensions
ALLOWED_EXTENSIONS = {"xls", "xlsx"}

def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route("/upload_faculties", methods=["POST"])
def upload_faculties():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Upload an Excel file."}), 400

    # Ensure 'uploads' folder exists
    os.makedirs("uploads", exist_ok=True)

    # Save the uploaded file temporarily
    file_path = os.path.join("uploads", file.filename)
    file.save(file_path)

    try:
        # Read the Excel file
        df = pd.read_excel(file_path)

        # Ensure required columns exist
        required_columns = {"emp_id", "email", "name", "password", "role"}
        if not required_columns.issubset(df.columns):
            return jsonify({"error": "Invalid file format. Missing required columns."}), 400

        # Get existing faculty and admin details from MongoDB
        existing_users = mongo.db.users.find({}, {"email": 1, "emp_id": 1, "role": 1, "_id": 0})
        
        existing_faculty_set = set()
        existing_admins_set = set()
        existing_admin_roles = set()

        for user in existing_users:
            email, emp_id, role = user["email"], user["emp_id"], user["role"]
            if role == "faculty":
                existing_faculty_set.add((email, emp_id))
            elif role in ["sjce_admin", "sjit_admin"]:
                existing_admins_set.add((email, emp_id))
                existing_admin_roles.add(role)

        new_users = []

        for _, row in df.iterrows():
            # Validate emp_id is a valid integer
            try:
                emp_id = int(row["emp_id"])
            except ValueError:
                return jsonify({"error": f"Invalid emp_id '{row['emp_id']}'. Must be a number."}), 400

            email = row["email"]
            name = row["name"]
            password = row["password"]
            role = row["role"]

            # Hash password
            hashed_password = bcrypt.generate_password_hash(password).decode("utf-8")

            if role == "faculty":
                if (email, emp_id) in existing_faculty_set:
                    return jsonify({"error": f"Faculty with email {email} or emp_id {emp_id} already exists"}), 400
                new_users.append({"emp_id": emp_id, "email": email, "name": name, "password": hashed_password, "role": role})

            elif role == "sjce_admin":
                if "sjce_admin" in existing_admin_roles:
                    return jsonify({"error": "sjce_admin already exists"}), 400
                if (email, emp_id) in existing_admins_set:
                    return jsonify({"error": f"Admin with email {email} or emp_id {emp_id} already exists"}), 400
                new_users.append({"emp_id": emp_id, "email": email, "name": name, "password": hashed_password, "role": role})

            elif role == "sjit_admin":
                if "sjit_admin" in existing_admin_roles:
                    return jsonify({"error": "sjit_admin already exists"}), 400
                if (email, emp_id) in existing_admins_set:
                    return jsonify({"error": f"Admin with email {email} or emp_id {emp_id} already exists"}), 400
                new_users.append({"emp_id": emp_id, "email": email, "name": name, "password": hashed_password, "role": role})



        if new_users:
            for emp in new_users:
                if emp["role"] == "faculty":
                    mongo.db.faculty_domain.insert_one({"emp_id": emp["emp_id"], "emp_name": emp["name"], "classes": []})
            mongo.db.users.insert_many(new_users)

        return jsonify({"message": "Users successfully added", "added_users": new_users}), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        # Remove the file after processing (if it exists)
        if os.path.exists(file_path):
            os.remove(file_path)






# Allowed roles
ALLOWED_ROLES = ["faculty", "sjit_admin", "sjce_admin"]

# Route to fetch users with specific roles
@app.route("/get_users", methods=["GET"])
def get_users():
    try:
        users = list(mongo.db.users.find({"role": {"$in": ALLOWED_ROLES}}, {"_id": 0}))
        return jsonify({"success": True, "users": users}), 200
    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500





# Route to remove a user
@app.route("/remove_user", methods=["DELETE"])
def remove_user():
    try:
        data = request.json
        emp_id = int(data.get("emp_id"))

        if not emp_id:
            return jsonify({"success": False, "error": "Emp ID is required"}), 400

        result = mongo.db.users.delete_one({"emp_id": emp_id})
        mongo.db.faculty_domain.delete_one({"emp_id": emp_id})
        
        if result.deleted_count > 0:
            return jsonify({"success": True, "message": "User removed successfully"}), 200
        else:
            return jsonify({"success": False, "error": "User not found"}), 404

    except Exception as e:
        return jsonify({"success": False, "error": str(e)}), 500







@app.route("/upload_students", methods=["POST"])
def upload_students():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]

    if file.filename == "":
        return jsonify({"error": "No selected file"}), 400

    if not allowed_file(file.filename):
        return jsonify({"error": "Invalid file format. Upload an Excel file."}), 400

    os.makedirs("uploads", exist_ok=True)
    file_path = os.path.join("uploads", file.filename)
    file.save(file_path)

    try:
        df = pd.read_excel(file_path)

        required_columns = {"REGISTER NUMBER", "NAME OF THE STUDENT", "NAME OF THE COLLEGE", "DEPT", "DOMAIN", "CLASS DAYS", "DOMAIN_ID", "EMP_ID"}

        if not required_columns.issubset(df.columns):
            return jsonify({"error": "Invalid file format. Missing required columns."}), 400

        # Check for duplicate register numbers
        duplicate_registers = df[df.duplicated(subset=["REGISTER NUMBER"], keep=False)]["REGISTER NUMBER"].unique().tolist()

        if duplicate_registers:
            return jsonify({
                "error": "Duplicate register numbers found, Duplicate Register Numbers: " + str(duplicate_registers),
            }), 400
        
        unique_emp_ids = df["EMP_ID"].dropna().unique().tolist()

        missing_emp_ids = []

        for emp_id in unique_emp_ids:
            faculty_exists = mongo.db.faculty_domain.find_one({"emp_id": emp_id})
            if not faculty_exists:
                missing_emp_ids.append(emp_id)

        if missing_emp_ids:
            return jsonify({
                "error": "Faculties not found: " + str( missing_emp_ids)
            }), 400
        

        # Step 4: Find unique (DOMAIN, CLASS_DAYS, EMP_ID) combinations
        unique_classes = df[["EMP_ID", "DOMAIN", "DOMAIN_ID", "CLASS DAYS"]].drop_duplicates()

        # Step 5: Append CLASS_DAYS as an array and update MongoDB
        for _, row in unique_classes.iterrows():
            emp_id = row["EMP_ID"]
            domain = row["DOMAIN"]
            domain_id = row["DOMAIN_ID"]
            class_days = [day.strip() for day in row["CLASS DAYS"].split(",")]

            faculty = mongo.db.faculty_domain.find_one({"emp_id": emp_id})

            if faculty:
                # Check if the class with same domain_id already exists
                existing_classes = faculty.get("classes", [])
                class_exists = any(c["domain_id"] == domain_id for c in existing_classes)

                if not class_exists:
                    # Append new class entry
                    mongo.db.faculty_domain.update_one(
                        {"emp_id": emp_id},
                        {"$push": {
                            "classes": {
                                "days": class_days,
                                "domain": domain,
                                "domain_id": domain_id
                            }
                        }}
                    )

        for domain_id, group in df.groupby("DOMAIN_ID"):
            # Convert DataFrame to dictionary format and exclude 'domain_id', 'emp_id', 'class days'
            data = group.drop(columns=["DOMAIN_ID", "EMP_ID", "CLASS DAYS"]).to_dict(orient="records")

            # Get domain name from the first row (since DOMAIN is the same for all grouped items)
            domain_name = group["DOMAIN"].iloc[0]

            # Extract unique class days
            unique_class_days = list(group["CLASS DAYS"].unique())


            # Check if domain_id already exists in the collection
            existing_entry = mongo.db.students_data.find_one({"domain_id": domain_id})

            if existing_entry:
                # Extract existing register numbers
                existing_registers = {student["REGISTER NUMBER"] for student in existing_entry["students"]}

                # Check if any of the new students already exist
                duplicate_registers = [student for student in data if student["REGISTER NUMBER"] in existing_registers]

                if duplicate_registers:
                    return jsonify({
                        "error": "Duplicate register numbers found in domain. " + str([student["REGISTER NUMBER"] for student in duplicate_registers]) + " already resitered in " + domain_name + " - " + str(domain_id)
                    }), 400  # Send error response with duplicate register numbers

                # Append new students and update class days
                mongo.db.students_data.update_one(
                    {"_id": existing_entry["_id"]},
                    {
                        "$push": {"students": {"$each": data}},  # Append new students
                        "$addToSet": {"class_days": {"$each": unique_class_days}}  # Ensure unique class days
                    }
                )
            else:
                # Insert new entry
                record = {
                    "domain": domain_name,
                    "domain_id": domain_id,
                    "class_days": unique_class_days,  # Store class days as an array
                    "students": data  # Store all rows as a list inside the record
                }
                mongo.db.students_data.insert_one(record)


    except Exception as e:
        return jsonify({"error": str(e)}), 500

    finally:
        if os.path.exists(file_path):
            os.remove(file_path)

    return jsonify({"message": "File uploaded successfully"}), 200





@app.route("/students_data", methods=["GET"])
def get_students_data():
    students = list(mongo.db.students_data.find({}, {"_id": 0}))
    return jsonify(students)




@app.route("/students_data/<int:domain_id>", methods=["GET"])
def get_students_by_domain(domain_id):
    record = mongo.db.students_data.find_one({"domain_id": domain_id}, {"_id": 0})
    if record:
        return jsonify(record)
    return jsonify({"students": []})





@app.route("/students_data/<int:domain_id>/student/<register_number>", methods=["DELETE"])
def remove_student(domain_id, register_number):
    mongo.db.students_data.update_one(
        {"domain_id": int(domain_id)},
        {"$pull": {"students": {"REGISTER NUMBER": int(register_number)}}}
    )

    return jsonify({"message": "Student removed successfully"})






def get_domains_today():
    today_day = datetime.today().strftime('%A')  # Get today's day (e.g., "Monday")
    today_date = datetime.today().strftime('%d-%m-%Y')
    
    # Query: Find all documents where at least one class has today's day
    matching_docs = mongo.db.faculty_domain.find({"classes.days": today_day})
    attendance_col = mongo.db.attendance_records
    mapping = {}

    # Extract domain IDs from matched documents
    domain_ids = set()  # Use a set to avoid duplicates
    for doc in matching_docs:
        for class_info in doc.get("classes", []):
            if today_day in class_info.get("days", []):
                domain_ids.add(class_info["domain_id"])
                mapping[class_info["domain_id"]] = class_info["domain"]

    attendance_docs = attendance_col.find({"date": today_date}, {"attendance": 1, "_id": 0})

    for doc in attendance_docs:
        for att in doc["attendance"]:
            if att["domain_id"] in domain_ids:
                domain_ids.remove(att["domain_id"])
                del mapping[att["domain_id"]]

    

    for dId in domain_ids:
        atten = {}
        class_data = mongo.db.students_data.find_one({"domain_id": int(dId)}, {"_id": 0, "students": 1})
        emp_id, emp_name = mongo.db.faculty_domain.find({"classes.domain_id": 1002}, {"_id": 0, "emp_id": 1, "emp_name": 1})[0].values()
        atten["domain"] = mapping[dId]
        atten["domain_id"] = dId
        atten["emp_id"] = emp_id
        atten["name"] = emp_name
        lst = []

        for stu in class_data["students"]:
            lst.append({"reg_no": stu["REGISTER NUMBER"], "name": stu["NAME OF THE STUDENT"], "status": "NA", "department": stu["DEPT"], "college_name": stu["NAME OF THE COLLEGE"]})
        
        atten["attendance"] = lst

        mongo.db.attendance_records.update_one({"date": today_date}, {"$push": {"attendance": atten}}, upsert=True)







# Define time zone (adjust as per your region)
IST = pytz.timezone('Asia/Kolkata')  # Change if needed

scheduler = BackgroundScheduler()
scheduler.add_job(
    get_domains_today, 'cron', hour=12, minute=30, timezone=IST
) 

scheduler.start()

if __name__ == "__main__":
    app.run(debug=True)