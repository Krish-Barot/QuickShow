import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Loading from '../components/Loading';
import { ClockIcon, ChevronLeft, ArrowRightIcon } from 'lucide-react';
import { assets, dummyDateTimeData, dummyShowsData } from '../assets/assets';
import IsoFormat from '../lib/IsoTimeFormat';
import BlurCircle from '../components/BlurCircle';
import toast from 'react-hot-toast';

const SeatLayout = () => {
  const { id, date } = useParams();

  const centerRows = ["A", "B"];
  const sideRows = ["C", "D", "E", "F", "G", "H", "I", "J"];

  const [selectedSeats, setSelectedSeats] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [show, setShow] = useState([]);
  const navigate = useNavigate();

  const getShow = async () => {
    const show = dummyShowsData.find(show => show._id === id);

    if (show) {
      setShow({
        movie: show,
        dateTime: dummyDateTimeData
      })
    }


  }

  const handleSeatClick = (seatId) => {
    if (!selectedTime) {
      return toast("Please select time first");
    }

    if (!selectedSeats.includes(seatId) && selectedSeats.length >= 5) {
      return toast("You can select only 5 seats");
    }

    setSelectedSeats(prev => 
      prev.includes(seatId) 
        ? prev.filter(seat => seat !== seatId) 
        : [...prev, seatId]
    );
  }

  const renderSeats = (row) => {
    return (
      <div key={row} className='flex items-center gap-4 mb-6'>
        <span className='w-6 font-medium text-gray-400 text-sm'>{row}</span>
        <div className='flex gap-1'>
          {Array.from({ length: 4 }, (_, i) => (
            <button 
              key={`${row}${i + 1}`}
              onClick={() => handleSeatClick(`${row}${i + 1}`)}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
                selectedSeats.includes(`${row}${i + 1}`)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-primary/60'
              }`}
            >
              {row}{i + 1}
            </button>
          ))}
          {Array.from({ length: 5 }, (_, i) => (
            <button 
              key={`${row}${i + 5}`}
              onClick={() => handleSeatClick(`${row}${i + 5}`)}
              className={`h-10 w-10 flex items-center justify-center rounded-md transition-colors ${
                selectedSeats.includes(`${row}${i + 5}`)
                  ? 'bg-primary text-white border-primary'
                  : 'bg-gray-800/50 border border-gray-700 hover:border-primary/60'
              }`}
            >
              {row}{i + 5}
            </button>
          ))}
        </div>
      </div>
    );
  }

  useEffect(() => {
    getShow();
  }, [id])


  if (!show.dateTime || !show.dateTime[date]) {
    return <Loading />;
  }

  const availableTimes = show.dateTime[date] || [];

  return (
    <div className='px-6 md:px-16 lg:px-40 py-8 md:py-12'>

      {/* Movie and Date Info */}
      <div className='mb-8'>
        <h1 className='text-2xl md:text-3xl font-bold mb-2 mt-10'>{show.movie.title}</h1>
        <p className='text-gray-400 mb-4'>{new Date(date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })}</p>
      </div>

      <div className='flex flex-col lg:flex-row gap-8'>
        {/* Available Timings */}
        <div className='lg:w-1/4'>
          <div className='bg-primary/10 border border-primary/20 rounded-lg p-6 sticky top-32'>
            <h2 className='text-lg font-semibold mb-4'>Select Time</h2>
            <div className='space-y-2'>
              {availableTimes.map((timeSlot) => {
                const timeStr = timeSlot.time;
                return (
                  <div
                    key={timeStr}
                    onClick={() => setSelectedTime(timeStr)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md cursor-pointer transition-colors ${selectedTime === timeStr
                      ? 'bg-primary text-white'
                      : 'bg-gray-800/50 hover:bg-gray-800/80'
                      }`}
                  >
                    <ClockIcon className='w-4 h-4' />
                    <span className='text-sm'>{IsoFormat(timeStr)}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Seating Layout - Placeholder */}
        <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
          <BlurCircle top='-100px' left='-100px' />
          <BlurCircle bottom='0px' right='0px' />

          <h1 className='text-2xl font-semibold mb-4'>
            {selectedTime ? `Selected: ${new Date(selectedTime).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
              hour12: true
            })}` : 'Select a time'}
          </h1>

          <img src={assets.screenImage} alt="screenImage" />
          <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>

          <div className='w-full max-w-4xl mx-auto mt-10 text-sm text-gray-300'>
            {/* Center Rows (A, B) */}
            <div className='flex justify-center'>
              <div className='w-1/2 space-y-6'>
                {centerRows.map(row => renderSeats(row))}
              </div>
            </div>
            
            {/* Side Rows (C-J) */}
            <div className='flex justify-between mt-10'>
              {/* Left Side */}
              <div className='w-[45%] space-y-6'>
                {sideRows.slice(0, 4).map(row => renderSeats(row))}
              </div>
              
              {/* Right Side */}
              <div className='w-[45%] space-y-6'>
                {sideRows.slice(4).map(row => renderSeats(row))}
              </div>
            </div>
          </div>

          <button onClick={() => navigate("/my-bookings")} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95'>
            Proceed to Checkout
            <ArrowRightIcon strokeWidth={3} className='w-4 h-4'/>
          </button>
        </div>
      </div>
    </div>
  )
}

export default SeatLayout
