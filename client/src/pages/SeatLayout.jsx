import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { ClockIcon, ArrowRightIcon } from 'lucide-react';
import { assets } from '../assets/assets';
import IsoFormat from '../lib/IsoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';
import { useAppContext } from '../context/AppContext';

const SeatLayout = () => {
  const { id, date: dateParam } = useParams();
  const date = dateParam ? new Date(`${dateParam}T00:00:00`).toISOString().split('T')[0] : '';

  const centerRows = ["A", "B"];
  const sideRows = ["C", "D", "E", "F", "G", "H", "I", "J"];

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [occupiesSeats, setOccupiedSeats] = useState([]);
  const [show, setShow] = useState([]);
  const navigate = useNavigate();

  const { axios, getToken, user } = useAppContext();

  // Fetch show data
  const getShow = async () => {
    try {
      if (!id) {
        toast.error('No movie ID provided');
        navigate('/');
        return;
      }

      const { data } = await axios.get(`/api/show/movie/${id}`, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      });

      if (data.success) {
        setShow(data);
      } else {
        toast.error(data.message || 'Failed to load show details');
      }
    } catch (error) {
      console.error('Error fetching show:', error);
      toast.error(error.response?.data?.message || 'Failed to load show details');
      navigate('/');
    }
  };

  // Handle seat click
  const handleSeatClick = (seatId) => {
    if (!selectedTime) return toast("Please select time first");

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast("You can select only 5 seats");
    }

    if (occupiesSeats.includes(seatId)) return toast('This seat is already booked');

    setSelectedSeats(prev =>
      prev.includes(seatId) ? prev.filter(seat => seat !== seatId) : [...prev, seatId]
    );
  };

  // Fetch occupied seats
  const getOccupiedSeats = async () => {
    if (!selectedTime?.showId) {
      console.error('No showId found in selectedTime');
      return;
    }

    try {
      const { data } = await axios.get(`/api/booking/seats/${selectedTime.showId}`);
      if (data.success) {
        setOccupiedSeats(data.occupiedSeats || []);
      } else {
        toast.error(data.message || 'Failed to load seat information');
      }
    } catch (error) {
      console.error('Error fetching occupied seats:', error);
      toast.error('Failed to load seat information');
    }
  };

  // Render seats
  const renderSeats = (row) => (
    <div key={row} className='flex items-center gap-4 mb-6'>
      <span className='w-6 font-medium text-gray-400 text-sm'>{row}</span>
      <div className='flex gap-1'>
        {Array.from({ length: 4 }, (_, i) => {
          const seatId = `${row}${i + 1}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              disabled={occupiesSeats.includes(seatId)}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors
                ${selectedSeats.includes(seatId) ? 'bg-primary text-white border-primary' :
                  occupiesSeats.includes(seatId) ? 'bg-gray-800/50 opacity-50 cursor-not-allowed' :
                    'bg-gray-800/50 border border-gray-700 hover:border-primary/60'}
              `}
            >
              {seatId}
            </button>
          );
        })}
        {Array.from({ length: 5 }, (_, i) => {
          const seatId = `${row}${i + 5}`;
          return (
            <button
              key={seatId}
              onClick={() => handleSeatClick(seatId)}
              disabled={occupiesSeats.includes(seatId)}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors
                ${selectedSeats.includes(seatId) ? 'bg-primary text-white border-primary' :
                  occupiesSeats.includes(seatId) ? 'bg-gray-800/50 opacity-50 cursor-not-allowed' :
                    'bg-gray-800/50 border border-gray-700 hover:border-primary/60'}
              `}
            >
              {seatId}
            </button>
          );
        })}
      </div>
    </div>
  );

  // Book tickets
  const bookTickets = async () => {
    try {
      if (!user) return toast.error("Please login to proceed");
      if (!selectedSeats.length || !selectedTime) {
        return toast.error('Please select both time and seats');
      }

      const { data } = await axios.post(
        '/api/booking/create',
        { showId: selectedTime.showId, selectedSeats },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        window.location.href = data.url;
      } else {
        toast.error(data.message || 'Failed to book tickets');
      }
    } catch (error) {
      console.error('Error booking tickets:', error);
      toast.error(error.response?.data?.message || 'Failed to book tickets');
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  useEffect(() => {
    if (selectedTime) getOccupiedSeats();
  }, [selectedTime]);

  if (!show.dateTime || !show.dateTime[date]) return <Loading />;

  const availableTimes = show.dateTime[date] || [];

  return (
    <div className='px-6 md:px-16 lg:px-40 py-8 md:py-12'>
      {/* Movie and Date Info */}
      <div className='mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold mb-2 mt-10'>{show.movie?.title}</h1>
        {date ? (
          <p className='text-gray-400 mb-4'>
            {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </p>
        ) : (
          <p className='text-gray-400 mb-4'>No date selected</p>
        )}
      </div>

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Available Timings */}
        <div className='lg:w-1/4'>
          <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 sticky top-32'>
            <h2 className='text-lg font-semibold mb-4'>Select Time</h2>
            <div className='space-y-2'>
              {availableTimes.map(timeSlot => {
                const timeStr = timeSlot.time;
                return (
                  <div
                    key={timeSlot.showId}
                    onClick={() => setSelectedTime({ time: timeStr, showId: timeSlot.showId })}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors
                      ${selectedTime?.time === timeStr ? 'bg-primary text-white' : 'bg-gray-800/50 hover:bg-gray-800/80'}
                    `}
                  >
                    <ClockIcon className='w-4 h-4' />
                    <span className='text-sm'>{IsoFormat(timeStr)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Seating Layout */}
        <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
          <BlurCircle top='-100px' left='-100px' />
          <BlurCircle bottom='0px' right='0px' />

          <h1 className='text-2xl font-semibold mb-4'>
            {selectedTime
              ? `Selected: ${new Date(selectedTime.time).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })}`
              : 'Select a time'}
          </h1>

          <img src={assets.screenImage} alt="screenImage" />
          <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>

          <div className='w-full max-w-4xl mx-auto mt-10 text-sm text-gray-300'>
            {/* Center Rows */}
            <div className='flex justify-center'>
              <div className='w-1/2 space-y-6'>{centerRows.map(row => renderSeats(row))}</div>
            </div>

            {/* Side Rows */}
            <div className='flex justify-between mt-10'>
              <div className='w-[45%] space-y-6'>{sideRows.slice(0, 4).map(row => renderSeats(row))}</div>
              <div className='w-[45%] space-y-6'>{sideRows.slice(4).map(row => renderSeats(row))}</div>
            </div>
          </div>

          <button
            onClick={bookTickets}
            className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'
          >
            Proceed to Checkout
            <ArrowRightIcon strokeWidth={3} className='w-4 h-4' />
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeatLayout;
