import React from 'react'


function schoolBanner(props: any) {
  let image = props.image
  let title = props.title
  let icon = props.icon
  let message = props.message

  return (
    <section className='bg-gray-500'>
        <div className='relative isolate bg-[url("/img/chiu-school-of-business.jpg")] bg-cover bg-no-repeat bg-left-top'>

        <div className='mx-auto max-w-7xl px-6 sm:py-40 lg:flex lg:items-center lg:gap-x-10 lg:px-8 lg:py-64'>
            
        <h1 className='mt-10 text-pretty text-2xl font-semibold tracking-tight text-gray-900 sm:text-7xl'>{props.title}</h1>            
        </div>
        </div>
    </section>
  )
}

export default schoolBanner