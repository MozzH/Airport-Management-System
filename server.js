const express = require('express');
const bodyParser = require('body-parser');
const { sequelize, Airport, Itinerary, Airplane, Flights, Reservation } = require('./database');
const { check, validationResult, param } = require('express-validator');
const { Op } = require('sequelize');

const path = require('path');
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

const app = express();
const port = 3000;
app.use(bodyParser.json());

const apiRouter = express.Router();

/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*===========Airport CRUD OPERATIONS============*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/

//Code to validate the constraints of the code using the "Express-Validator" library.
const airportValidationConstraints = [
    check('Name')
      .notEmpty().withMessage('Name is required.')
      .isAlphanumeric().withMessage('Name should contain only alphanumeric characters.')
      .custom(async (value) => {
        const existingAirport = await Airport.findOne({ where: { Name: value } });
        if (existingAirport) {
          throw new Error('Airport name already exists.');
        }
      }),
    check('Latitude').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude.'),
    check('Longitude').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude.'),
    check('Timezone')
        .notEmpty().withMessage('Timezone is required.')
        .custom(value => {
            const regex = /^GMT[+-]\d{1,2}$/;
            if (!regex.test(value)) {
                throw new Error('Invalid timezone.');
                }
            const offset = parseInt(value.substring(4));
            if (offset < 0 || offset > 12) {
                throw new Error('Invalid timezone offset.');
                }
            return true;
        })
  ];


//POST Method
apiRouter.post('/airport/create', airportValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { Name, Latitude, Longitude, Timezone } = req.body;
  
    const existingAirport = await Airport.findOne({ where: { Name } });
    if (existingAirport) {
      return res.status(409).json({ error: 'Airport name already exists.' });
    }
  
    const airport = await Airport.create({ Name, Latitude, Longitude, Timezone });
  
    res.status(200).json({
      message: 'Airport created successfully',
      airport: {
        ID: airport.id,
        Name: airport.Name,
        Latitude: airport.Latitude,
        Longitude: airport.Longitude,
        Timezone: airport.Timezone,
        updatedAt: airport.updatedAt,
        createdAt: airport.createdAt
      }
    });
  });

//PUT method
apiRouter.put('/airport/update', airportValidationConstraints, async (req, res) => {
    const { id, Name, Latitude, Longitude, Timezone } = req.body;
  
    if (!id || isNaN(id) || id <= 0) {
      return res.status(422).json({ error: 'Invalid request body - missing or invalid airport ID' });
    }
  
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const airport = await Airport.findByPk(id);
    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }
  
    await airport.update({ Name, Latitude, Longitude, Timezone });
    res.status(200).json({
      message: `Airport ${id} successfully updated`,
      airport: {
        ID: airport.id,
        Name: airport.Name,
        Latitude: airport.Latitude,
        Longitude: airport.Longitude,
        Timezone: airport.Timezone,
        updatedAt: airport.updatedAt,
        createdAt: airport.createdAt
      }
    });
  });

//GET LIST Method
apiRouter.get('/airport/list', async (req, res) => {
    const airports = await Airport.findAll();
    res.json(airports);
  });


//GET BY ID Method
apiRouter.get('/airport/:id', async (req, res) => {
    const id = parseInt(req.params.id);
    if (isNaN(id) || id <= 0) {
      return res.status(422).json({ error: 'Invalid airport ID' });
    }
  
    const airport = await Airport.findByPk(id);
    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }
  
    res.json(airport);
  });


//DELETE Method
apiRouter.delete('/airport/delete', async (req, res) => {
    const { id } = req.body;
    if (!id || isNaN(id) || id <= 0) {
      return res.status(422).json({ error: 'Invalid request body - missing or invalid airport ID' });
    }
  
    const airport = await Airport.findByPk(id);
    if (!airport) {
      return res.status(404).json({ error: 'Airport not found' });
    }
  
    const deletedAirport = await airport.destroy();
    if (!deletedAirport) {
      return res.status(422).json({ error: 'Could not delete airport' });
    }
  
    res.status(200).json({ message: 'Airport deleted' });
  });


  /*=========== EJS Code =========*/

  //GET Method
  apiRouter.get('/airport/all', async (req, res) => {
    const airports = await Airport.findAll();
    res.render('index', { airports });
});

  

/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==========Itinerary CRUD OPERATIONS===========*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/

const itineraryValidationConstraints = [
    check('code')
      .notEmpty().withMessage('Code is required.')
      .trim()
      .isAlphanumeric().withMessage('Code should contain only alphanumeric characters.'),
    check('originAirportId')
      .notEmpty().withMessage('Origin airport ID is required.')
      .isInt({ min: 1 }).withMessage('Origin airport ID must be a valid non-zero integer.')
      .custom(async (value) => {
        const airport = await Airport.findOne({ where: { id: value } });
        if (!airport) {
          throw new Error('Origin airport does not exist.');
        }
      }),
    check('destinationAirportId')
      .notEmpty().withMessage('Destination airport ID is required.')
      .isInt({ min: 1 }).withMessage('Destination airport ID must be a valid non-zero integer.')
      .custom(async (value) => {
        const airport = await Airport.findOne({ where: { id: value } });
        if (!airport) {
          throw new Error('Destination airport does not exist.');
        }
      }),
    check('duration')
      .notEmpty().withMessage('Duration is required.')
      .isInt({ min: 1 }).withMessage('Duration must be a valid non-zero integer representing the flight duration in minutes.')
  ];
  
  //POST Method
  apiRouter.post('/itinerary/create', itineraryValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { code, originAirportId, destinationAirportId, duration } = req.body;
  
    const existingItinerary = await Itinerary.findOne({ where: { code } });
    if (existingItinerary) {
      return res.status(409).json({ error: 'Itinerary code already exists.' });
    }
  
    try {
      const itinerary = await Itinerary.create({
        Code: code,
        OriginAirportID: originAirportId,
        DestinationAirportID: destinationAirportId,
        DurationMinutes: duration
      });
  
      res.status(200).json({
        message: 'Itinerary created successfully',
        itinerary: {
          id: itinerary.ID,
          code: itinerary.Code,
          originAirportId: itinerary.OriginAirportID,
          destinationAirportId: itinerary.DestinationAirportID,
          duration: itinerary.DurationMinutes,
          updatedAt: itinerary.updatedAt,
          createdAt: itinerary.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  //PUT Method
  apiRouter.put('/itinerary/update', itineraryValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { id, code, originAirportId, destinationAirportId, duration } = req.body;
  
    try {
      const itinerary = await Itinerary.findByPk(id);
  
      if (!itinerary) {
        return res.status(404).json({ error: 'Itinerary not found' });
      }
  
      itinerary.Code = code;
      itinerary.OriginAirportID = originAirportId;
      itinerary.DestinationAirportID = destinationAirportId;
      itinerary.DurationMinutes = duration;
      await itinerary.save();
  
      res.status(200).json({
        message: `Itinerary ${id} updated successfully`,
        itinerary: {
          id: itinerary.ID,
          code: itinerary.Code,
          originAirportId: itinerary.OriginAirportID,
          destinationAirportId: itinerary.DestinationAirportID,
          duration: itinerary.DurationMinutes,
          updatedAt: itinerary.updatedAt,
          createdAt: itinerary.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

//Generic GET Method
apiRouter.get('/itinerary/list', async (req, res) => {
    try {
      const itineraries = await Itinerary.findAll();
      const formattedItineraries = itineraries.map(itinerary => {
        return {
          id: itinerary.ID,
          code: itinerary.Code,
          originAirportId: itinerary.OriginAirportID,
          destinationAirportId: itinerary.DestinationAirportID,
          duration: itinerary.DurationMinutes,
          updatedAt: itinerary.updatedAt,
          createdAt: itinerary.createdAt
        }
      });
      res.status(200).json(formattedItineraries);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

//GET Method by ID
apiRouter.get('/itinerary/:id', async (req, res) => {
    try {
      const itinerary = await Itinerary.findByPk(req.params.id);
      if (!itinerary) {
        return res.status(404).json({ error: 'Itinerary not found' });
      }
      res.status(200).json({
          id: itinerary.ID,
          code: itinerary.Code,
          originAirportId: itinerary.OriginAirportID,
          destinationAirportId: itinerary.DestinationAirportID,
          duration: itinerary.DurationMinutes,
          updatedAt: itinerary.updatedAt,
          createdAt: itinerary.createdAt
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
});

//DELETE Method
apiRouter.delete('/itinerary/delete', async (req, res) => {
    const { id } = req.body;
  
    if (!id || isNaN(id) || id <= 0) {
      return res.status(422).json({ error: 'Invalid request body - missing or invalid itinerary ID' });
    }
    try {
      const itinerary = await Itinerary.findByPk(id);
      if (!itinerary) {
        return res.status(404).json({ error: 'Itinerary not found' });
      }
  
      await itinerary.destroy();
  
      res.status(200).json({
        message: `Itinerary ${id} deleted successfully`,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  

/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==========AIRPLANE CRUD OPERATIONS============*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/


const airplaneValidationConstraints = [
    check('name')
      .notEmpty().withMessage('Name is required.')
      .trim()
      .isAlphanumeric().withMessage('Name should contain only alphanumeric characters.'),
    check('model')
      .notEmpty().withMessage('Model is required.')
      .trim()
      .isAlphanumeric().withMessage('Model should contain only alphanumeric characters.'),
    check('capacity')
      .notEmpty().withMessage('Capacity is required.')
      .isInt({ min: 1 }).withMessage('Capacity must be a valid positive, non-zero integer.')
  ];
  
  //POST Method
  apiRouter.post('/airplane/create', airplaneValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { name, model, capacity } = req.body;
  
    const existingAirplane = await Airplane.findOne({ where: { name } });
    if (existingAirplane) {
      return res.status(409).json({ error: 'Airplane name already exists.' });
    }
  
    try {
      const airplane = await Airplane.create({
        Name: name,
        Model: model,
        Capacity: capacity
      });
  
      res.status(200).json({
        message: 'Airplane created successfully',
        airplane: {
          id: airplane.ID,
          name: airplane.Name,
          model: airplane.Model,
          capacity: airplane.Capacity,
          updatedAt: airplane.updatedAt,
          createdAt: airplane.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  //DELETE Method
  apiRouter.delete('/airplane/delete', async (req, res) => {
    const { id } = req.body;
    if (!id || isNaN(id) || id <= 0) {
        return res.status(422).json({ error: 'Invalid request body - missing or invalid airplane ID' });
      }
      
      try {
        const airplane = await Airplane.findByPk(id);
        if (!airplane) {
          return res.status(404).json({ error: 'Airplane not found' });
        }
      
        await airplane.destroy();
      
        res.status(200).json({
          message: `Airplane ${id} deleted successfully`,
        });
      } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
      }
    });

//Generic GET Method
apiRouter.get('/airplane/list', async (req, res) => {
    try {
      const airplanes = await Airplane.findAll();
      res.status(200).json(airplanes);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
  
//GET BY ID Method
apiRouter.get('/airplane/:id', async (req, res) => {
    const id = req.params.id;
    try {
      const airplane = await Airplane.findOne({ where: { id } });
      if (!airplane) {
        return res.status(404).json({ error: 'Airplane not found' });
      }
      res.status(200).json(airplane);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*===========FLIGHT CRUD OPERATIONS=============*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/

const flightValidationConstraints = [
    check('ItineraryID')
    .notEmpty().withMessage('Itinerary ID is required.')
    .isInt({ min: 1 }).withMessage('Itinerary ID must be a valid positive, non-zero integer.'),
    check('DepartureTime')
    .notEmpty().withMessage('Departure time is required.')
    .isInt({ min: 0 }).withMessage('Departure time must be a valid positive integer.'),
    check('ArrivalTime')
    .notEmpty().withMessage('Arrival time is required.')
    .isInt({ min: 0 }).withMessage('Arrival time must be a valid positive integer.'),
    check('AirplaneID')
    .notEmpty().withMessage('Airplane ID is required.')
    .isInt({ min: 1 }).withMessage('Airplane ID must be a valid positive, non-zero integer.')
    ];

//POST Method
apiRouter.post('/flight/create', flightValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
    }
    const { ItineraryID, DepartureTime, ArrivalTime, AirplaneID } = req.body;

    const existingItinerary = await Itinerary.findOne({ where: { ID: ItineraryID } });
    if (!existingItinerary) {
      return res.status(409).json({ error: 'Invalid itinerary ID.' });
    }
    
    const existingAirplane = await Airplane.findOne({ where: { ID: AirplaneID } });
    if (!existingAirplane) {
      return res.status(409).json({ error: 'Invalid airplane ID.' });
    }
    
    if (ArrivalTime <= DepartureTime) {
      return res.status(422).json({ error: 'Arrival time must be after departure time.' });
    }
    
    try {
      const flight = await Flights.create({
        ItineraryID,
        DepartureTime,
        ArrivalTime,
        AirplaneID
      });
    
      res.status(200).json({
        message: 'Flight created successfully',
        flight: {
          id: flight.ID,
          itineraryID: flight.ItineraryID,
          departureTime: flight.DepartureTime,
          arrivalTime: flight.ArrivalTime,
          airplaneID: flight.AirplaneID,
          updatedAt: flight.updatedAt,
          createdAt: flight.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }

});

//PUT Method
apiRouter.put('/flight/update', flightValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { id, ItineraryID, DepartureTime, ArrivalTime, AirplaneID } = req.body;
  
    //Checking if flight with given ID exists
    const existingFlight = await Flights.findOne({ where: { ID: id } });
    if (!existingFlight) {
      return res.status(404).json({ error: 'Flight with this ID does not exist.' });
    }
  
    const existingItinerary = await Itinerary.findOne({ where: { ID: ItineraryID } });
    if (!existingItinerary) {
      return res.status(409).json({ error: 'Invalid itinerary ID.' });
    }
  
    const existingAirplane = await Airplane.findOne({ where: { ID: AirplaneID } });
    if (!existingAirplane) {
      return res.status(409).json({ error: 'Invalid airplane ID.' });
    }
  
    if (ArrivalTime <= DepartureTime) {
      return res.status(422).json({ error: 'Arrival time must be after departure time.' });
    }
  
    try {
      await existingFlight.update({
        ItineraryID,
        DepartureTime,
        ArrivalTime,
        AirplaneID
      });
  
      res.status(200).json({
        message: 'Flight updated successfully',
        flight: {
          id: existingFlight.ID,
          itineraryID: existingFlight.ItineraryID,
          departureTime: existingFlight.DepartureTime,
          arrivalTime: existingFlight.ArrivalTime,
          airplaneID: existingFlight.AirplaneID,
          updatedAt: existingFlight.updatedAt,
          createdAt: existingFlight.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  


//GET Method
apiRouter.get('/flight/list', async (req, res) => {
    const { airplaneID, itineraryID, arrivesBefore } = req.body;
  
    if (airplaneID && isNaN(airplaneID)) {
      res.status(422).json({ message: 'Invalid airplaneID parameter' });
      return;
    }
  
    if (itineraryID && isNaN(itineraryID)) {
      res.status(422).json({ message: 'Invalid itineraryID parameter' });
      return;
    }
  
    try {
      const existingAirplane = airplaneID ? await Airplane.findByPk(airplaneID) : null;
  
      if (airplaneID && !existingAirplane) {
        res.status(409).json({ message: 'Invalid airplaneID, no corresponding item in the database' });
        return;
      }
  
      const existingItinerary = itineraryID ? await Itinerary.findByPk(itineraryID) : null;
  
      if (itineraryID && !existingItinerary) {
        res.status(409).json({ message: 'Invalid itineraryID, no corresponding item in the database' });
        return;
      }
  
      let filter = {};
      if (airplaneID) {
        filter.AirplaneID = { [Op.eq]: airplaneID };
      }
      if (itineraryID) {
        filter.ItineraryID = { [Op.eq]: itineraryID };
      }
      if (arrivesBefore) {
        filter.ArrivalTime = { [Op.lt]: arrivesBefore };
      }
  
      const flights = await Flights.findAll({
        where: filter,
        include: [
          {
            model: Itinerary,
            as: 'Itinerary'
          },
          {
            model: Airplane,
            as: 'Airplane'
          }
        ]
      });
  
      res.status(200).json(flights);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'Server error' });
    }
  });
  

//DELETE Method
apiRouter.delete('/flight/delete', async (req, res) => {
    const { ID } = req.body;
  
    try {
      //Checking if the flight exists
      const existingFlight = await Flights.findOne({ where: { ID } });
      if (!existingFlight) {
        return res.status(404).json({ error: 'Flight not found.' });
      }
  
      //Deleting the flight
      await Flights.destroy({ where: { ID } });
  
      res.status(200).json({ message: 'Flight deleted successfully.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Server error' });
    }
  });

  
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*========RESERVATION CRUD OPERATIONS============*/
/*==============================================*/
/*==============================================*/
/*==============================================*/
/*==============================================*/

const reservationValidationConstraints = [
    check('PassengerName')
      .notEmpty().withMessage('Passenger name is required.')
      .trim()
      .isAlphanumeric().withMessage('Passenger name should contain only alphanumeric characters.')
      .isLength({ min: 2 }).withMessage('Passenger name should contain at least 2 characters.'),
    check('FlightID')
      .notEmpty().withMessage('Flight ID is required.')
      .isInt({ min: 1 }).withMessage('Flight ID must be a valid positive, non-zero integer.')
  ];
  
  //POST Method
  apiRouter.post('/reservation/create', reservationValidationConstraints, async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { PassengerName, FlightID } = req.body;
  
    try {
      //Checking if the flight exists in the database and include related Itinerary and Airplane models
      const existingFlight = await Flights.findOne({
        where: { ID: FlightID },
        include: [
          {
            model: Itinerary,
            as: 'Itinerary',
            include: [
              { model: Airport, as: 'OriginAirport' },
              { model: Airport, as: 'DestinationAirport' },
            ]
          },
          {
            model: Airplane,
            as: 'Airplane'
          }
        ]
      });
      if (!existingFlight) {
        return res.status(409).json({ error: 'No such flight exists.' });
      }
  
      //Checking if the number of reservations for the flight exceeds the airplane's capacity
      const reservationsCount = await Reservation.count({ where: { FlightID } });
      if (reservationsCount >= existingFlight.Airplane.Capacity) {
        return res.status(409).json({ error: 'The flight is already full.' });
      }
  
      const reservation = await Reservation.create({
        PassengerName,
        FlightID
      });
  
      res.status(200).json({
        message: 'Reservation created successfully',
        reservation: {
          ID: reservation.ID,
          PassengerName: reservation.PassengerName,
          Flight: {
            ID: existingFlight.ID,
            DepartureTime: existingFlight.DepartureTime,
            ArrivalTime: existingFlight.ArrivalTime,
            Itinerary: {
              ID: existingFlight.Itinerary.ID,
              Code: existingFlight.Itinerary.Code,
              OriginAirport: {
                ID: existingFlight.Itinerary.OriginAirport.ID,
                Name: existingFlight.Itinerary.OriginAirport.Name,
                Latitude: existingFlight.Itinerary.OriginAirport.Latitude,
                Longitude: existingFlight.Itinerary.OriginAirport.Longitude,
                Timezone: existingFlight.Itinerary.OriginAirport.Timezone,
              },
              DestinationAirport: {
                ID: existingFlight.Itinerary.DestinationAirport.ID,
                Name: existingFlight.Itinerary.DestinationAirport.Name,
                Latitude: existingFlight.Itinerary.DestinationAirport.Latitude,
                Longitude: existingFlight.Itinerary.DestinationAirport.Longitude,
                Timezone: existingFlight.Itinerary.DestinationAirport.Timezone,
              },
              DurationMinutes: existingFlight.Itinerary.DurationMinutes,
            },
            Airplane: {
              ID: existingFlight.Airplane.ID,
              Name: existingFlight.Airplane.Name,
              Model: existingFlight.Airplane.Model,
              Capacity: existingFlight.Airplane.Capacity,
            },
          },
          updatedAt: reservation.updatedAt,
          createdAt: reservation.createdAt
        }
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create reservation.' });
    }
    });


//DELETE Method
apiRouter.delete('/reservation/delete', async (req, res) => {
    const { ID } = req.body;
  
    if (!ID) {
      return res.status(400).json({ error: 'ID is required in the body.' });
    } else if (Object.keys(req.body).length !== 1) {
      return res.status(400).json({ error: 'Only the ID should be provided in the body.' });
    }
  
    try {
      const reservation = await Reservation.findOne({ where: { ID } });
  
      if (!reservation) {
        return res.status(404).json({ error: 'Reservation not found.' });
      }
  
      await reservation.destroy();
      res.status(200).json({ message: 'Reservation deleted successfully.' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Something went wrong. Please try again later.' });
    }
  });

//GET Method to retrieve all reservations for a specific flight
apiRouter.get('/reservation/flight/:ID', [param('ID').isInt({ min: 1 })], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(422).json({ errors: errors.array() });
    }
  
    const { ID } = req.params;
  
    try {
      //Checking if the flight exists in the database and include related Itinerary and Airplane models
      const existingFlight = await Flights.findOne({
        where: { ID },
        include: [
          {
            model: Itinerary,
            as: 'Itinerary',
            include: [
              { model: Airport, as: 'OriginAirport' },
              { model: Airport, as: 'DestinationAirport' },
            ]
          },
          {
            model: Airplane,
            as: 'Airplane'
          }
        ]
      });
      if (!existingFlight) {
        return res.status(409).json({ error: 'No such flight exists.' });
      }
  
      //Retrieving all the reservations for the flight
      const reservations = await Reservation.findAll({
        where: { FlightID: existingFlight.ID },
        include: [
          {
            model: Flights,
            as: 'Flight',
            include: [
              {
                model: Itinerary,
                as: 'Itinerary',
                include: [
                  { model: Airport, as: 'OriginAirport' },
                  { model: Airport, as: 'DestinationAirport' },
                ]
              },
              {
                model: Airplane,
                as: 'Airplane'
              }
            ]
          }
        ]
      });
  
      res.status(200).json({
        message: 'Reservations retrieved successfully',
        reservations: reservations.map((reservation) => ({
          ID: reservation.ID,
          PassengerName: reservation.PassengerName,
          Flight: {
            ID: existingFlight.ID,
            DepartureTime: existingFlight.DepartureTime,
            ArrivalTime: existingFlight.ArrivalTime,
            Itinerary: {
              ID: existingFlight.Itinerary.ID,
              Code: existingFlight.Itinerary.Code,
              OriginAirport: {
                ID: existingFlight.Itinerary.OriginAirport.ID,
                Name: existingFlight.Itinerary.OriginAirport.Name,
                Latitude: existingFlight.Itinerary.OriginAirport.Latitude,
                Longitude: existingFlight.Itinerary.OriginAirport.Longitude,
                Timezone: existingFlight.Itinerary.OriginAirport.Timezone,
              },
              DestinationAirport: {
                ID: existingFlight.Itinerary.DestinationAirport.ID,
                Name: existingFlight.Itinerary.DestinationAirport.Name,
                Latitude: existingFlight.Itinerary.DestinationAirport.Latitude,
                Longitude: existingFlight.Itinerary.DestinationAirport.Longitude,
                Timezone: existingFlight.Itinerary.DestinationAirport.Timezone,
              },
              DurationMinutes: existingFlight.Itinerary.DurationMinutes,
            },
            Airplane: {
              ID: existingFlight.Airplane.ID,
              Name: existingFlight.Airplane.Name,
              Model: existingFlight.Airplane.Model,
              Capacity: existingFlight.Airplane.Capacity,
            },
          },
          updatedAt: reservation.updatedAt,
          createdAt: reservation.createdAt
        }))
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Internal server error.' });
    }
  });


//Linking the /api prefix to the router
app.use('/api', apiRouter);

app.listen(port, async () => {
  console.log(`Example app listening at http://localhost:${port}`);

  //Synchronise the database
  await sequelize.sync();
  console.log('Database synchronised');
});
