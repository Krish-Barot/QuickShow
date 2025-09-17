import React, { useState } from 'react'
import BlurCircle from './BlurCircle'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const DateSelect = ({ dateTime, id }) => {
    const [selected, setSelected] = useState(null);
    const navigate = useNavigate();

    const onBookHandler = () => {
        if(!selected){
            return toast('Please Select a Date');
        }
        
        // Format the date as YYYY-MM-DD for consistency
        const formattedDate = new Date(selected).toISOString().split('T')[0];
        navigate(`/movies/${id}/${formattedDate}`);
        scrollTo(0, 0);
    }

    return (
        <div id='dateSelect' className='pt-30'>
            <div className='flex flex-col md:flex-row items-center justify-between gap-10 relative p-8 bg-primary/10 border border-primary/20 rounded-lg'>
                <BlurCircle top='-100px' left='-100px' />
                <BlurCircle top='100px' right='0px' />
                <div>
                    <p className='text-lg font-semibold'>Choose Date</p>
                    <div className='flex items-center gap-6 text-sm mt-5'>
                        <ChevronLeftIcon width={28}/>
                        <span className='grid grid-cols-3 md:flex flex-wrap md:max-w-lg gap-4'>
                            {Object.keys(dateTime).map((dateStr) => {
                                // Ensure consistent date parsing by using the full ISO string
                                const date = new Date(dateStr);
                                const formattedDate = date.toISOString().split('T')[0];
                                return (
                                    <button 
                                        key={formattedDate}
                                        onClick={() => setSelected(formattedDate)}
                                        className={`flex flex-col items-center justify-center h-14 w-14 aspect-square rounded cursor-pointer ${
                                            selected === formattedDate ? 'bg-primary text-white' : 'border border-primary/20'
                                        }`}
                                    >
                                        <span>{date.getDate()}</span>
                                        <span className='text-xs'>{date.toLocaleDateString("en-US", {month: "short"})}</span>
                                    </button>
                                );
                            })}
                        </span>
                        <ChevronRightIcon width={28}/>
                    </div>
                </div>

                <button onClick={onBookHandler} className='bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary/90 transition-all cursor-pointer'>Book Now</button>
            </div>
        </div>
    )
}

export default DateSelect
