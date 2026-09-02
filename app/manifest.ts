import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'RHHS ECO Club - Classroom Champion',
    short_name: 'ECO Champion',
    description: 'Track and celebrate eco-friendly classrooms at Rafic Hariri High School with live rankings and green evaluations.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#16a34a',
    icons: [
      {
        src: '/Eco Champ.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/Eco Champ.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
