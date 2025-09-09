import { useState } from 'react'
import { dummyTrailers } from '../assets/assets'
import BlurCircle from './BlurCircle'
import { PlayCircleIcon } from 'lucide-react'

const TrailerSection = () => {
    const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0])
    
  return (
    <div className='px-6 md:px-16 lg:px-24 xl:px-44 py-20 overflow-hidden'>
      <p className='text-gray-300 font-medium text-lg max-w-[960px] mx-auto'>Trailers</p>

      <div className='relative mt-6'>
        <BlurCircle top='-100px' right='-100px'/>
        <div className='w-full max-w-[960px] aspect-video mx-auto bg-black rounded-lg overflow-hidden'>
          <iframe
            src={`https://www.youtube.com/embed/${getYouTubeId(currentTrailer.videoUrl)}?autoplay=1&mute=1&rel=0&showinfo=0&controls=1`}
            className='w-full h-full'
            allowFullScreen
            title="Movie Trailer"
          />
        </div>
      </div>

      <div className='group grid grid-cols-4 gap-4 md:gap-8 mt-8  max-w-3xl mx-auto'>
        {dummyTrailers.map((trailer) => (
            <div key={trailer.image} className='relative group-hover:not-hover:opacity-50 hover:-translate-y-1 duration-300 transition max-md:h-60 md:max-h-60 cursor-pointer' onClick={() => setCurrentTrailer(trailer)}>
                <img src={trailer.image} alt='trailer' className='rounded-lg w-full h-full object-cover brightness-75'/>
                <PlayCircleIcon strokeWidth={1.6} className='absolute top-1/2 left-1/2 w-5  md:w-8 h-5 md:h-12 transform -translate-x-1/2 -translate-y-1/2' />
            </div>
        ))}
      </div>
    </div>
  )
}

// Helper function to extract YouTube video ID from URL
function getYouTubeId(url) {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default TrailerSection;

