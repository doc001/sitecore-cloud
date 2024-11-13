import React from 'react'
import '@/styles/banners.css'

function openHouse() {
    return (
        <section className='open-house'>
            <div className='wrapper'>
                <div className='flex-item-left'>
                    <div className='header'>Your journey starts at our open house</div>
                </div>
                <div className='flex-item-right'>
                    <a rel='noopener noreferrer' href='https://choose.bowvalleycollege.ca/open-house' className='button-red' target='_blank'>Register your interest</a>
                </div>
            </div>
        </section>
    )
}

export default openHouse