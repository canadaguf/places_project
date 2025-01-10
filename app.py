from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import os

app = Flask(__name__)
CORS(app)

# Set configuration from environment variables
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('SQLALCHEMY_DATABASE_URI')
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY')

db = SQLAlchemy(app)
bcrypt = Bcrypt(app)


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(255), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    def set_password(self, password):
        self.password_hash = bcrypt.generate_password_hash(password).decode('utf-8')

    def check_password(self, password):
        return bcrypt.check_password_hash(self.password_hash, password)


@app.route('/api/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required', 'status': 'error'}), 400

    user = User.query.filter_by(username=username).first()
    if not user or not user.check_password(password):
        return jsonify({'message': 'Invalid username or password', 'status': 'error'}), 401

    # Generate JWT token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.datetime.utcnow() + datetime.timedelta(hours=1)  # Token expires in 1 hour
    }, app.config['SECRET_KEY'])

    return jsonify({'message': 'Login successful', 'token': token, 'status': 'success'}), 200


@app.route('/api/register', methods=['POST'])
def register():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required', 'status': 'error'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists', 'status': 'error'}), 400

    new_user = User(username=username)
    new_user.set_password(password)
    db.session.add(new_user)
    db.session.commit()

    return jsonify({'message': 'User registered successfully', 'status': 'success'}), 201


class PlaceData(db.Model):
    __tablename__ = 'place'

    id = db.Column(db.Integer, primary_key=True)
    place_id = db.Column(db.String(255), nullable=True)
    name = db.Column(db.String(255), nullable=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.Text, nullable=False)
    category = db.Column(db.ARRAY(db.String), nullable=False)
    description = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    work_hours = db.Column(db.String, nullable=False)
    website = db.Column(db.String, nullable=False)
    phone = db.Column(db.String, nullable=False)


class Review(db.Model):
    __tablename__ = 'review'

    id = db.Column(db.Integer, primary_key=True)
    id_place = db.Column(db.Integer, db.ForeignKey('place.id'), nullable=False)
    review_text = db.Column(db.Text, nullable=False)
    review_score = db.Column(db.Integer, nullable=False)
    id_user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    # Relationships
    place = db.relationship('PlaceData', backref='reviews', lazy=True)
    user = db.relationship('User', backref='reviews', lazy=True)


@app.route('/api/place-data', methods=['POST'])
def save_place():
    data = request.json
    place_id = data.get('place_id')
    # Debugging: Log the place_id to check if it's correctly received
    print(f"Received place_id: {place_id}")

    # Check if place with the same place_id already exists
    existing_place = PlaceData.query.filter_by(place_id=place_id).first()

    # Debugging: Log the result of the query
    print(f"Existing place: {existing_place}")
    if existing_place is not None:
        return jsonify({'message': 'Данное заведение уже записано в базе', 'status': 'place_id exists'}), 409

    new_data = PlaceData(
        place_id=place_id,
        name=data.get('display_name'),
        latitude=float(data.get('lat')),
        longitude=float(data.get('lon')),
        address=data.get('address'),
        category=data.get('categories', []),
        description=data.get('description'),
        work_hours=data.get('work_hours'),
        website=data.get('url'),
        phone=data.get('phone')
    )
    db.session.add(new_data)
    db.session.commit()
    return jsonify({'message': 'Успешная запись ;)', 'status': 'success'}), 201


@app.route('/api/places', methods=['GET'])
def get_places():
    # Fetch all places from the database
    places = PlaceData.query.all()

    # Convert the places to a list of dictionaries
    places_list = []
    for place in places:
        places_list.append({
            'id': place.id,
            'place_id': place.place_id,
            'name': place.name,
            'latitude': place.latitude,
            'longitude': place.longitude,
            'address': place.address,
            'category': place.category,
            'description': place.description,
            'work_hours': place.work_hours,
            'website': place.website,
            'phone': place.phone,
        })

    return jsonify({'places': places_list}), 200


@app.route('/api/place/<int:place_id>', methods=['GET'])
def get_place(place_id):
    place = PlaceData.query.filter_by(id=place_id).first()
    if not place:
        return jsonify({'message': 'Place not found', 'status': 'error'}), 404

    # Fetch reviews for the place
    reviews = Review.query.filter_by(id_place=place_id).all()

    # Calculate average rating and number of reviews
    total_reviews = len(reviews)
    if total_reviews > 0:
        total_score = sum(review.review_score for review in reviews)
        average_rating = round(total_score / total_reviews, 1)
    else:
        average_rating = 0

    return jsonify({
        'place': {
            'id': place.id,
            'place_id': place.place_id,
            'name': place.name,
            'latitude': place.latitude,
            'longitude': place.longitude,
            'address': place.address,
            'category': place.category,
            'description': place.description,
            'work_hours': place.work_hours,
            'website': place.website,
            'phone': place.phone,
            'average_rating': average_rating,
            'total_reviews': total_reviews,
        }
    }), 200


@app.route('/api/place/<int:place_id>', methods=['PUT'])
def update_place(place_id):
    place = PlaceData.query.filter_by(id=place_id).first()
    if not place:
        return jsonify({'message': 'Place not found', 'status': 'error'}), 404

    data = request.json
    place.name = data.get('name', place.name)
    place.address = data.get('address', place.address)
    place.category = data.get('category', place.category)
    place.description = data.get('description', place.description)
    place.work_hours = data.get('work_hours', place.work_hours)
    place.website = data.get('website', place.website)
    place.phone = data.get('phone', place.phone)

    db.session.commit()

    return jsonify({
        'message': 'Place updated successfully',
        'place': {
            'id': place.id,
            'place_id': place.place_id,
            'name': place.name,
            'address': place.address,
            'category': place.category,
            'description': place.description,
            'work_hours': place.work_hours,
            'website': place.website,
            'phone': place.phone,
        }
    }), 200


@app.route('/api/review', methods=['POST'])
def add_review():
    data = request.json
    id_place = data.get('id_place')
    id_user = data.get('id_user')
    review_text = data.get('review_text')
    review_score = data.get('review_score')

    if not id_place or not id_user or not review_text or not review_score:
        return jsonify({'message': 'All fields are required', 'status': 'error'}), 400

    new_review = Review(
        id_place=id_place,
        id_user=id_user,
        review_text=review_text,
        review_score=review_score
    )
    db.session.add(new_review)
    db.session.commit()

    return jsonify({'message': 'Review added successfully', 'status': 'success'}), 201


@app.route('/api/reviews/<int:place_id>', methods=['GET'])
def get_reviews(place_id):
    # Fetch all reviews for the given place_id
    reviews = Review.query.filter_by(id_place=place_id).all()

    # Convert reviews to a list of dictionaries
    reviews_list = []
    for review in reviews:
        reviews_list.append({
            'id': review.id,
            'id_place': review.id_place,
            'id_user': review.id_user,
            'review_text': review.review_text,
            'review_score': review.review_score,
            'created_at': review.created_at.strftime('%d/%m/%Y'),  # Format date as DD/MM/YYYY
            'username': review.user.username  # Access username from the related User model
        })

    return jsonify({'reviews': reviews_list}), 200


if __name__ == '__main__':
    app.run(debug=True)