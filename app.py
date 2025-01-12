from flask import Flask, request, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS
import jwt
import datetime
import os

app = Flask(__name__)
# Allow requests from both Netlify and Render (if needed)
allowed_origins = [
    "https://msc-places.netlify.app",
    "https://places-project-6i0r.onrender.com",  # Add your Render backend URL if needed
]
CORS(app, resources={r"/api/*": {"origins": allowed_origins}})
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:w8mj10CPxSQDW8if@abysmally-empowered-sunbeam.data-1.use1.tembo.io:5432/postgres')
db = SQLAlchemy(app)
bcrypt = Bcrypt(app)

# Secret key for JWT
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'A1b2C3d4E5f6G7h8I9j0K!l@M#n$O%p^Q&r*S(t)U_V+W-X=Y')


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

    place = db.relationship('PlaceData', backref='reviews', lazy=True)
    user = db.relationship('User', backref='reviews', lazy=True)


class List(db.Model):
    __tablename__ = 'lists'

    id = db.Column(db.Integer, primary_key=True)
    list_name = db.Column(db.String(255), nullable=False)
    id_user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    user = db.relationship('User', backref='user_lists', lazy=True)


class RelUserList(db.Model):
    __tablename__ = 'rel_user_list'

    id = db.Column(db.Integer, primary_key=True)
    id_user = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    id_list = db.Column(db.Integer, db.ForeignKey('lists.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())
    is_admin = db.Column(db.Boolean, default=False, nullable=False)

    # Relationships
    user = db.relationship('User', backref='rel_user_lists', lazy=True)
    list = db.relationship('List', backref='rel_user_lists', lazy=True)


class RelPlaceList(db.Model):
    __tablename__ = 'rel_place_list'

    id = db.Column(db.Integer, primary_key=True)
    id_place = db.Column(db.Integer, db.ForeignKey('place.id'), nullable=False)
    id_list = db.Column(db.Integer, db.ForeignKey('lists.id'), nullable=False)
    created_at = db.Column(db.TIMESTAMP, default=db.func.current_timestamp())

    # Relationships
    place = db.relationship('PlaceData', backref='rel_place_lists', lazy=True)
    list = db.relationship('List', backref='rel_place_lists', lazy=True)


@app.route('/')
def home():
    return jsonify({'message': 'Welcome to the backend!'}), 200


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


@app.route('/api/place-data', methods=['POST'])
def save_place():
    data = request.json
    place_id = data.get('place_id')
    print(f"Received place_id: {place_id}")

    existing_place = PlaceData.query.filter_by(place_id=place_id).first()
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


from flask import request, jsonify


@app.route('/api/places', methods=['GET'])
def get_places():
    # Check if a 'name' query parameter is provided
    name = request.args.get('name')

    if name:
        # If 'name' is provided, filter places by name (case-insensitive)
        places = PlaceData.query.filter(PlaceData.name.ilike(f'%{name}%')).all()
        places_list = [{
            'id': place.id,
            'name': place.name,
            'address': place.address,
            'latitude': place.latitude,
            'longitude': place.longitude,
        } for place in places]

        return jsonify({'places': places_list, 'status': 'success'}), 200
    else:
        # If no 'name' is provided, return all places
        places = PlaceData.query.all()
        places_list = [{
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
        } for place in places]

        return jsonify({'places': places_list}), 200


@app.route('/api/place/<int:place_id>', methods=['GET'])
def get_place(place_id):
    place = PlaceData.query.filter_by(id=place_id).first()
    if not place:
        return jsonify({'message': 'Place not found', 'status': 'error'}), 404

    reviews = Review.query.filter_by(id_place=place_id).all()
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
    reviews = Review.query.filter_by(id_place=place_id).all()
    reviews_list = []
    for review in reviews:
        reviews_list.append({
            'id': review.id,
            'id_place': review.id_place,
            'id_user': review.id_user,
            'review_text': review.review_text,
            'review_score': review.review_score,
            'created_at': review.created_at.strftime('%d/%m/%Y'),
            'username': review.user.username
        })

    return jsonify({'reviews': reviews_list}), 200


@app.route('/api/lists', methods=['GET'])
def get_lists():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing', 'status': 'error'}), 401

    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded_token['user_id']

        lists = List.query.filter_by(id_user=user_id).all()
        lists_data = [{
            'id': list.id,
            'list_name': list.list_name,
            'created_at': list.created_at.strftime('%d/%m/%Y'),
        } for list in lists]

        return jsonify({'lists': lists_data, 'status': 'success'}), 200

    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500


@app.route('/api/lists', methods=['POST'])
def create_list():
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing', 'status': 'error'}), 401

    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded_token['user_id']

        data = request.json
        list_name = data.get('list_name')

        if not list_name:
            return jsonify({'message': 'List name is required', 'status': 'error'}), 400

        # Create the new list
        new_list = List(list_name=list_name, id_user=user_id)
        db.session.add(new_list)
        db.session.commit()

        # Now add a row to the rel_user_list table
        new_rel_user_list = RelUserList(id_user=user_id, id_list=new_list.id, is_admin=True)
        db.session.add(new_rel_user_list)
        db.session.commit()

        return jsonify({'message': 'List created successfully', 'status': 'success'}), 201

    except Exception as e:
        db.session.rollback()  # Rollback in case of error
        return jsonify({'message': str(e), 'status': 'error'}), 500


@app.route('/api/lists/<int:list_id>/places', methods=['GET'])
def get_list_places(list_id):
    try:
        # Fetch places in the list
        places = PlaceData.query.join(RelPlaceList, PlaceData.id == RelPlaceList.id_place).filter(
            RelPlaceList.id_list == list_id).all()

        # Prepare the response data with ratings
        places_data = []
        for place in places:
            # Fetch reviews for the place
            reviews = Review.query.filter_by(id_place=place.id).all()
            total_reviews = len(reviews)

            # Calculate average rating
            if total_reviews > 0:
                total_score = sum(review.review_score for review in reviews)
                average_rating = round(total_score / total_reviews, 1)
            else:
                average_rating = 0

            # Add place data with ratings to the response
            places_data.append({
                'id': place.id,
                'name': place.name,
                'address': place.address,
                'latitude': place.latitude,
                'longitude': place.longitude,
                'average_rating': average_rating,
                'total_reviews': total_reviews,
            })

        return jsonify({'places': places_data, 'status': 'success'}), 200

    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500


@app.route('/api/lists/<int:list_id>/places', methods=['POST'])
def add_place_to_list(list_id):
    token = request.headers.get('Authorization')
    if not token:
        return jsonify({'message': 'Token is missing', 'status': 'error'}), 401

    try:
        decoded_token = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        user_id = decoded_token['user_id']

        data = request.json
        place_id = data.get('place_id')

        if not place_id:
            return jsonify({'message': 'Place ID is required', 'status': 'error'}), 400

        # Check if the place is already in the list
        existing_relation = RelPlaceList.query.filter_by(id_list=list_id, id_place=place_id).first()
        if existing_relation:
            return jsonify({'message': 'Place is already in the list', 'status': 'error'}), 400

        new_relation = RelPlaceList(id_list=list_id, id_place=place_id)
        db.session.add(new_relation)
        db.session.commit()

        return jsonify({'message': 'Place added to list successfully', 'status': 'success'}), 201

    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500


@app.route('/api/lists/<int:list_id>/users', methods=['GET'])
def get_list_users(list_id):
    try:
        users = User.query.join(RelUserList, User.id == RelUserList.id_user).filter(RelUserList.id_list == list_id).all()
        users_data = [{
            'id': user.id,
            'username': user.username,
        } for user in users]

        return jsonify({'users': users_data, 'status': 'success'}), 200

    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500


@app.route('/api/lists/<int:list_id>', methods=['GET'])
def get_list_details(list_id):
    try:
        # Fetch the list by ID
        list = List.query.filter_by(id=list_id).first()
        if not list:
            return jsonify({'message': 'List not found', 'status': 'error'}), 404

        # Fetch places in the list
        places = PlaceData.query.join(RelPlaceList, PlaceData.id == RelPlaceList.id_place).filter(RelPlaceList.id_list == list_id).all()
        places_data = [{
            'id': place.id,
            'name': place.name,
            'address': place.address,
            'latitude': place.latitude,
            'longitude': place.longitude,
        } for place in places]

        # Fetch users connected to the list
        users = User.query.join(RelUserList, User.id == RelUserList.id_user).filter(RelUserList.id_list == list_id).all()
        users_data = [{
            'id': user.id,
            'username': user.username,
        } for user in users]

        # Return list details
        list_data = {
            'id': list.id,
            'list_name': list.list_name,
            'created_at': list.created_at.strftime('%d/%m/%Y'),
            'places': places_data,
            'users': users_data,
        }

        return jsonify({'list': list_data, 'status': 'success'}), 200

    except Exception as e:
        return jsonify({'message': str(e), 'status': 'error'}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port)