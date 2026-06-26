'use client'
import { use } from 'react'
import BackHeader from '@/components/shared/BackHeader'
import BottomNav from '@/components/shared/BottomNav'
import Button from '@/components/shared/Button'

const exercises: Record<string, {
  title: string; duration: string; level: string; icon: string
  description: string; benefits: string[]; steps: string[]; cautions: string[]
}> = {
  '1': {
    title: 'Prenatal Yoga', duration: '30 min', level: 'Beginner', icon: '🧘',
    description: 'A gentle flow designed to support your changing body throughout pregnancy. Focuses on breath, flexibility, and mental calm.',
    benefits: ['Reduces lower back pain', 'Improves sleep quality', 'Decreases stress and anxiety', 'Strengthens pelvic floor', 'Increases body awareness'],
    steps: [
      'Begin in a comfortable seated position — cross-legged or on a bolster',
      'Spend 5 minutes on breath work: 4-count inhale, 6-count exhale',
      'Move through cat-cow stretches for 5 minutes to warm the spine',
      'Practice supported warrior 1 and 2 with a chair nearby for balance',
      'End with 10 minutes of supported savasana using a pregnancy bolster',
    ],
    cautions: ['Avoid lying flat on your back after 16 weeks', 'Skip deep twists — use open twists instead', 'Always consult your provider before starting'],
  },
  '2': {
    title: 'Walking', duration: '30–45 min', level: 'All levels', icon: '🚶',
    description: 'Low-impact cardiovascular exercise that supports circulation, mood, and sleep throughout all trimesters.',
    benefits: ['Improves circulation', 'Maintains healthy weight gain', 'Boosts mood via endorphins', 'Prepares body for labor', 'Easy on joints'],
    steps: [
      'Wear supportive shoes with good arch support',
      'Start with a 5-minute slow warm-up pace',
      'Maintain a pace where you can hold a conversation comfortably',
      'Walk for 20–40 minutes at this comfortable pace',
      'Cool down with 5 minutes of slow walking and light stretching',
    ],
    cautions: ['Stop if you feel dizzy or short of breath', 'Avoid hills in late pregnancy', 'Stay hydrated — bring water'],
  },
  '3': {
    title: 'Pelvic Floor Exercises', duration: '10 min', level: 'All levels', icon: '💪',
    description: 'Targeted exercises to strengthen the pelvic floor, reduce incontinence risk, and prepare for labor.',
    benefits: ['Prevents urinary leakage', 'Supports pelvic organs', 'Speeds postpartum recovery', 'Reduces perineal trauma risk', 'Improves core stability'],
    steps: [
      'Find a comfortable position: seated, lying, or standing',
      'Identify your pelvic floor by imagining stopping urine flow',
      'Squeeze and lift the pelvic floor — hold for 5–10 seconds',
      'Release fully and rest for equal time',
      'Repeat 10–15 times, 3 sets daily',
    ],
    cautions: ['Do not practice while urinating', 'Ensure you are fully relaxing between contractions', 'Seek physio guidance if you have prolapse symptoms'],
  },
  '4': {
    title: 'Prenatal Pilates', duration: '20–30 min', level: 'Intermediate', icon: '🤸',
    description: 'Adapted core work that strengthens without straining. Focuses on postural muscles and breath integration.',
    benefits: ['Reduces back pain', 'Improves posture', 'Strengthens deep core', 'Reduces diastasis recti risk', 'Improves balance'],
    steps: [
      'Begin with diaphragmatic breathing in a seated position',
      'Perform 10 pelvic tilts on all-fours to warm up the spine',
      'Side-lying clam shells: 15 reps each side for hip stability',
      'Bird-dog: opposite arm and leg extensions, 10 reps each side',
      'Seated ball squeeze (if available) for inner thigh and pelvic floor',
    ],
    cautions: ['Avoid supine exercises after 16 weeks', 'Modify all exercises for bump clearance', 'Stop if abdominal coning or doming occurs'],
  },
  '5': {
    title: 'Swimming', duration: '30 min', level: 'All levels', icon: '🏊',
    description: 'Full-body low-impact exercise ideal for all trimesters. The water supports your weight, relieving joint pressure.',
    benefits: ['Zero impact on joints', 'Full body workout', 'Relieves back pain', 'Keeps body cool', 'Reduces swelling'],
    steps: [
      'Warm up with 5 minutes of gentle breaststroke',
      'Swim 20 minutes alternating between breaststroke and backstroke',
      'Avoid butterfly stroke — too much core compression',
      'Use a pool noodle for water walking in later trimesters',
      'Cool down with gentle floating and stretching',
    ],
    cautions: ['Avoid scuba diving', 'Check pool chlorine levels are standard', 'Get in and out carefully — surfaces can be slippery'],
  },
  '6': {
    title: 'Gentle Stretching', duration: '15 min', level: 'Beginner', icon: '🌙',
    description: 'Evening wind-down routine to release muscle tension, reduce leg cramps, and prepare body for sleep.',
    benefits: ['Reduces leg cramps', 'Improves sleep', 'Releases hip tension', 'Calms nervous system', 'Reduces restless leg syndrome'],
    steps: [
      'Begin with 3 minutes of deep breathing, lying on your left side',
      'Gentle hip circles: 10 each direction seated on the edge of bed',
      'Figure-4 stretch for glutes and piriformis: 30 seconds each side',
      'Seated forward fold with wide legs to release inner thighs',
      'Legs up the wall (supported) for 5 minutes to reduce leg swelling',
    ],
    cautions: ['Do not overstretch — pregnancy hormones increase joint laxity', 'Avoid deep hip flexor stretches in third trimester', 'Place a pillow between knees when side-lying'],
  },
}

export default function ExerciseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const ex = exercises[id]

  if (!ex) {
    return <div className="min-h-screen bg-cream flex items-center justify-center"><p className="text-muted text-sm">Exercise not found</p></div>
  }

  return (
    <div className="min-h-screen bg-cream pb-24">
      <BackHeader href="/movement" />

      {/* Hero */}
      <div className="px-5 mb-5">
        <div className="bg-white border border-border rounded-3xl px-5 py-6 text-center">
          <span className="text-5xl mb-3 block">{ex.icon}</span>
          <h1 className="font-serif text-2xl text-charcoal">{ex.title}</h1>
          <div className="flex items-center justify-center gap-3 mt-2">
            <span className="text-xs text-muted">{ex.duration}</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span className="text-xs text-muted">{ex.level}</span>
          </div>
        </div>
      </div>

      <div className="px-5 mb-4">
        <p className="text-sm text-muted leading-relaxed">{ex.description}</p>
      </div>

      {/* Benefits */}
      <div className="px-5 mb-5">
        <h2 className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Benefits</h2>
        <div className="flex flex-wrap gap-2">
          {ex.benefits.map((b) => (
            <span key={b} className="text-xs bg-gold-light text-gold-dark px-3 py-1.5 rounded-pill border border-gold/20 font-medium">{b}</span>
          ))}
        </div>
      </div>

      {/* Steps */}
      <div className="px-5 mb-5">
        <h2 className="text-xs text-muted uppercase tracking-wider font-medium mb-3">How to do it</h2>
        <div className="flex flex-col gap-3">
          {ex.steps.map((step, i) => (
            <div key={i} className="flex items-start gap-3 bg-white border border-border rounded-2xl px-4 py-3">
              <span className="w-6 h-6 rounded-full bg-gold-light text-gold text-xs font-medium flex items-center justify-center flex-shrink-0">
                {i + 1}
              </span>
              <p className="text-sm text-charcoal leading-relaxed">{step}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Cautions */}
      <div className="px-5 mb-6">
        <h2 className="text-xs text-muted uppercase tracking-wider font-medium mb-3">Important notes</h2>
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-4 py-4">
          <div className="flex flex-col gap-2">
            {ex.cautions.map((c) => (
              <div key={c} className="flex items-start gap-2">
                <span className="text-amber-500 text-xs mt-0.5">⚠</span>
                <p className="text-xs text-amber-800 leading-relaxed">{c}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5">
        <Button fullWidth>Start Exercise</Button>
      </div>

      <BottomNav />
    </div>
  )
}
