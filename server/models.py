from sqlalchemy_serializer import SerializerMixin
from flask_login import UserMixin
from sqlalchemy.orm import validates
from sqlalchemy.ext.associationproxy import association_proxy
from sqlalchemy.ext.hybrid import hybrid_property
import re
from config import db, bcrypt

class User(db.Model, SerializerMixin, UserMixin):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String, unique=True, nullable=False)
    _password_hash = db.Column(db.String, nullable=False)

    cards = db.relationship('Card', secondary='user_cards', back_populates='users', cascade='all, delete', passive_deletes=True)

    @property
    def unique_artists(self):
        unique_artists = {card.artist for card in self.cards}
        sorted_artists = sorted(unique_artists, key=lambda artist: artist.name)
        return [artist for artist in sorted_artists]

    @property
    def unique_sets(self):
        unique_sets = {card.set for card in self.cards}
        sorted_sets = sorted(unique_sets, key=lambda set: set.name)
        return [set for set in sorted_sets]
    
    serialize_rules = ('-cards.users', '-_password_hash')

    @hybrid_property
    def password_hash(self):
        return self._password_hash
    
    @password_hash.setter
    def password_hash(self, password):
        # Validate before hashing
        self.validate_password('_password_hash', password)
        # Hashing the password
        password_hash = bcrypt.generate_password_hash(
            password.encode('utf-8'))
        self._password_hash = password_hash.decode('utf-8')    

    def authenticate(self, password):
        return bcrypt.check_password_hash(
            self._password_hash, password.encode('utf-8'))
    
    @classmethod
    def get(self, id):
        return User.query.get(id)
    def is_authenticated(self):
        return True
    def is_active(self):
        return True
    def is_anonymous(self):
        return False
    def get_id(self):
        return str(self.id)
    
    def to_dict(self):
        data = super().to_dict()
        data['artists'] = [artist.to_dict() for artist in self.unique_artists]
        data['sets'] = [set.to_dict() for set in self.unique_sets]
        return data
    
    @validates('_password_hash')
    def validate_password(self, key, password):
        if len(password) < 8:
            raise ValueError('Password must be at least 8 characters long.')
        if not re.search(r'[A-Z]', password):
            raise ValueError('Password must contain at least one uppercase letter.')
        if not re.search(r'[0-9]', password):
            raise ValueError('Password must contain at least one digit.')
        if not re.search(r'[!@#$%^&*(),.?":{}|<>]', password):
            raise ValueError('Password must contain at least one special character.')
        return password
    
    @validates('username')
    def validate_text(self, key, value):
        if not value:
            raise ValueError(f'{key} cannot be empty.')
        if type(value) != str:
            raise ValueError(f'{key} must be a string.')
        if key == 'username':
            if not 3 <= len(value) <= 20:
                raise ValueError('Username must be between 3 and 20 characters.')
        return value


class UserCard(db.Model, SerializerMixin):
    __tablename__ = 'user_cards'
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), primary_key=True)
    card_id = db.Column(db.Integer, db.ForeignKey('cards.id', ondelete='CASCADE'), primary_key=True)


class Card(db.Model, SerializerMixin):
    __tablename__ = 'cards'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    art = db.Column(db.String, nullable=False)

    set_id = db.Column(db.Integer, db.ForeignKey('sets.id'))
    set = db.relationship('Set', back_populates='cards', lazy='joined')

    artist_id = db.Column(db.Integer, db.ForeignKey('artists.id'))
    artist = db.relationship('Artist', back_populates='cards', lazy='joined')
    users = db.relationship('User', secondary='user_cards', back_populates='cards')

    serialize_rules = ('-users.cards', '-set.cards', '-artist.cards')

    @validates('art')
    def validate_text(self, key, value):
        if not value:
            raise ValueError('Card must include a linked image.')
        if type(value) != str:
            raise ValueError('Art link must be a string.')
        return value   


class Set(db.Model, SerializerMixin):
    __tablename__ ='sets'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)
    release_date = db.Column(db.Date, nullable=False)

    cards = db.relationship('Card', back_populates='set')
    artists = association_proxy('cards', 'artist')

    @validates('name')
    def validate_text(self, key, value):
        if not value:
            raise ValueError(f'{key} cannot be empty.')
        if type(value) != str:
            raise ValueError(f'{key} must be a string.')
        if not 3 <= len(value) <= 30:
                raise ValueError('Set name must be between 3 and 30 characters.')
        return value
            
class Artist(db.Model, SerializerMixin):
    __tablename__ = 'artists'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String, unique=True, nullable=False)

    cards = db.relationship('Card', back_populates='artist')
    sets = association_proxy('cards', 'set')

    @validates('name')
    def validate_text(self, key, value):
        if not value:
            raise ValueError(f'{key} cannot be empty.')
        if type(value) != str:
            raise ValueError(f'{key} must be a string.')
        if not 3 <= len(value) <= 30:
                raise ValueError('Artist name must be between 3 and 30 characters.')
        return value