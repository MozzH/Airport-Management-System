const { Sequelize } = require('sequelize');

//Setting up the database
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
});

//Setting up the tables of the database
const Airport = sequelize.define('Airport', {
  ID: { type: Sequelize.INTEGER, primaryKey: true },
  Name: { type: Sequelize.STRING, unique: true },
  Latitude: Sequelize.FLOAT,
  Longitude: Sequelize.FLOAT,
  Timezone: Sequelize.STRING,
});

const Itinerary = sequelize.define('Itinerary', {
  ID: { type: Sequelize.INTEGER, primaryKey: true },
  Code: { type: Sequelize.STRING, unique: true },
  OriginAirportID: Sequelize.INTEGER,
  DestinationAirportID: Sequelize.INTEGER,
  DurationMinutes: Sequelize.INTEGER,
});

const Flights = sequelize.define('Flights', {
  ID: { type: Sequelize.INTEGER, primaryKey: true },
  ItineraryID: Sequelize.INTEGER,
  DepartureTime: Sequelize.DATE,
  ArrivalTime: Sequelize.DATE,
  AirplaneID: Sequelize.INTEGER,
});

const Reservation = sequelize.define('Reservation', {
  ID: { type: Sequelize.INTEGER, primaryKey: true },
  PassengerName: Sequelize.STRING,
  FlightID: Sequelize.INTEGER,
});

const Airplane = sequelize.define('Airplane', {
  ID: { type: Sequelize.INTEGER, primaryKey: true },
  Name: { type: Sequelize.STRING, unique: true },
  Model: Sequelize.STRING,
  Capacity: Sequelize.INTEGER,
});

//Setting up the relationships of the database
Airport.hasMany(Itinerary, { foreignKey: 'OriginAirportID', as: 'Origin' });
Airport.hasMany(Itinerary, { foreignKey: 'DestinationAirportID', as: 'Destination' });

Itinerary.belongsTo(Airport, { foreignKey: 'OriginAirportID', as: 'OriginAirport' });
Itinerary.belongsTo(Airport, { foreignKey: 'DestinationAirportID', as: 'DestinationAirport' });
Itinerary.hasMany(Flights, { foreignKey: 'ItineraryID', as: 'Flights' });

Flights.belongsTo(Itinerary, { foreignKey: 'ItineraryID', as: 'Itinerary' });
Flights.belongsTo(Airplane, { foreignKey: 'AirplaneID', as: 'Airplane' });
Flights.hasOne(Reservation, { foreignKey: 'FlightID', as: 'Reservation' });

Reservation.belongsTo(Flights, { foreignKey: 'FlightID', as: 'Flight' });

//To synchronize the data with the database
sequelize.sync()
  .then(() => {
    console.log('Database synchronised');
  })
  .catch(err => {
    console.error('Error synchronising database:', err);
  });

//Exporting the modules so they can be used in server.js
module.exports = {
  Airport,
  Itinerary,
  Flights,
  Reservation,
  Airplane,
  sequelize
};