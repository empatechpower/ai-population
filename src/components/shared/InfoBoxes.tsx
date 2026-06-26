// ─────────────────────────────────────────────────────────────
// All info boxes — pre-configured with content
// Import individually from this file
// ─────────────────────────────────────────────────────────────
import InfoBox from './InfoBox'

// ── 1. Evening Breastfeeding ─────────────────── Postpartum / Recovery page
export function EveningBreastfeedingBox() {
  return (
    <InfoBox
      id="evening-breastfeeding"
      emoji="🌙"
      title="Why Evening Breastfeeding Is Especially Beneficial"
      subtitle="Your body naturally changes in the evening — making nighttime feeds uniquely powerful"
      accentColor="#667EEA"
      items={[
        {
          icon: '🧠',
          title: 'Higher Prolactin Levels',
          body: 'Prolactin — the hormone responsible for milk production — peaks in the evening and at night. Your body can produce more milk, often with a richer composition.',
        },
        {
          icon: '😌',
          title: 'Better Calming Effect for Your Baby',
          body: 'Evening breast milk contains more calming compounds including tryptophan and melatonin precursors. Your baby becomes more relaxed, sleeps better, and feels more secure.',
        },
        {
          icon: '🍼',
          title: 'Supports Brain Development',
          body: 'The composition of evening milk helps regulate the sleep-wake cycle, support the nervous system, and improve emotional stability.',
        },
        {
          icon: '💧',
          title: 'Richer Nutrient Profile',
          body: 'After a full day of eating and hydration, your blood may be well-supplied with nutrients. Since breast milk is produced from your blood, it can be more nutrient-dense in the evening.',
        },
        {
          icon: '❤️',
          title: 'Stronger Bonding',
          body: 'Evening feeding is often calmer and more intimate — it strengthens the emotional connection and sense of safety for the baby.',
        },
      ]}
      conclusion="Evening breastfeeding is not just convenient — it aligns with your body's natural rhythms to better nourish, calm, and support your baby's development."
    />
  )
}

// ── 2. Hospital Birth Environment ────────────── Postpartum / Recovery page
export function HospitalBirthBox() {
  return (
    <InfoBox
      id="hospital-birth"
      emoji="🏥"
      title="What to Be Mindful of During Hospital Birth"
      subtitle="The first moments after birth are extremely sensitive — environment matters"
      accentColor="#A8B9A5"
      items={[
        {
          icon: '🌿',
          title: 'Sensitive Nervous System',
          body: "Your baby's nervous system is not fully developed at birth. A calm, low-stimulation environment helps reduce stress and supports smoother adaptation.",
        },
        {
          icon: '💡',
          title: 'Light Exposure Matters',
          body: 'Bright lights in delivery rooms can overstimulate newborns. Softer lighting supports eye adaptation and reduces stress.',
        },
        {
          icon: '🤱',
          title: 'Immediate Skin-to-Skin Contact',
          body: 'Direct contact with the mother right after birth stabilizes heart rate and breathing, supports body temperature regulation, and strengthens bonding and breastfeeding success.',
        },
        {
          icon: '🦠',
          title: 'Microbiome Transfer',
          body: 'During birth, your baby is exposed to beneficial bacteria that support immune system development and gut health. This process is directly influenced by birth environment and early contact.',
        },
        {
          icon: '📱',
          title: 'Phone & External Stimulation',
          body: 'There is no strong evidence that taking photos is harmful — but limiting devices helps keep the environment calm and focused on bonding, reducing unnecessary stress.',
        },
        {
          icon: '⚡',
          title: 'Medical Devices & Environment',
          body: 'Hospital equipment is designed to be safe for newborns. Minimizing unnecessary exposure and keeping the space calm is beneficial — focus should be on natural bonding.',
        },
      ]}
      conclusion="The most important factors are not technology itself, but the environment around your baby: calmness, low stress, natural contact, and gentle adaptation to the new world."
    />
  )
}

// ── 3. Oral Health ───────────────────────────── First pregnancy phase
export function OralHealthBox() {
  return (
    <InfoBox
      id="oral-health"
      emoji="🦷"
      title="Why Your Oral Health Matters for Your Baby"
      subtitle="Your mouth microbiome directly influences your baby's development"
      accentColor="#D4B06A"
      items={[
        {
          icon: '🦠',
          title: 'Connection Between Mouth & Baby',
          body: 'The mouth contains billions of bacteria. During pregnancy, harmful bacteria from gum inflammation can enter the bloodstream and reach the placenta — influencing the baby\'s environment.',
        },
        {
          icon: '⚠️',
          title: 'Risk of Gum Disease',
          body: 'Gingivitis and periodontitis are linked to increased risk of preterm birth, lower birth weight, and higher inflammatory stress for the baby.',
        },
        {
          icon: '🧬',
          title: 'Impact on Baby\'s Immune System',
          body: 'A healthy oral microbiome helps support balanced immune development. After birth, the baby\'s microbiome is partly shaped by the mother through contact, feeding, and environment.',
        },
        {
          icon: '🧠',
          title: 'Early Development Influence',
          body: 'Chronic inflammation in the mother\'s body can affect nutrient transport and influence early organ and brain development.',
        },
        {
          icon: '🍼',
          title: 'Breastfeeding Connection',
          body: 'Bacteria from the mother — including oral flora — can transfer during close contact. A balanced microbiome supports healthier immune programming in the baby.',
        },
        {
          icon: '✅',
          title: 'What to Do',
          body: 'Daily brushing + flossing, treat gum inflammation early, regular dental check-ups during pregnancy, avoid high sugar intake, and support good bacteria through a balanced diet with vitamins C and D.',
        },
      ]}
      conclusion="A healthy mouth is not just about teeth — it directly supports your baby's development, immune system, and overall health from the very beginning."
    />
  )
}

// ── 4. Father Sleep & Sperm ──────────────────── TTC / Pre-pregnancy
export function FatherSleepBox() {
  return (
    <InfoBox
      id="father-sleep"
      emoji="😴"
      title="Sleep & Sperm Quality — Father's Impact on Baby"
      subtitle="Sleep is one of the most underestimated factors affecting male fertility"
      accentColor="#8B85C1"
      items={[
        {
          icon: '🧬',
          title: 'Hormone Regulation (Testosterone)',
          body: 'Most testosterone is produced during deep sleep. Poor sleep lowers testosterone levels — reducing sperm production and quality.',
        },
        {
          icon: '🧪',
          title: 'Sperm Count & Quality',
          body: 'Studies show that men who sleep less than 6 hours have lower sperm count, reduced motility (movement), and more abnormal sperm shapes.',
        },
        {
          icon: '🧠',
          title: 'DNA Integrity',
          body: 'Lack of sleep increases oxidative stress which can damage sperm DNA — raising the risk of lower fertilization success and potential developmental issues.',
        },
        {
          icon: '⚡',
          title: 'Circadian Rhythm Matters',
          body: 'Irregular sleep from shift work or late nights disrupts hormone cycles and negatively affects sperm development.',
        },
        {
          icon: '👶',
          title: 'Impact on the Baby',
          body: 'Healthy sperm contributes to better embryo development, lower risk of complications, and a stronger genetic foundation for the baby.',
        },
        {
          icon: '✅',
          title: 'How to Optimise',
          body: '7–9 hours of consistent sleep, regular sleep schedule, avoid screens before bed, reduce stress, support recovery with magnesium and a healthy diet.',
        },
      ]}
      conclusion="Sleep is not just rest — it directly affects sperm quality and plays a role in giving your future baby the best possible start."
    />
  )
}

// ── 5. Gestational Diabetes Info ─────────────── Nutrition page (conditional)
export function GestationalDiabetesBox() {
  return (
    <InfoBox
      id="gestational-diabetes"
      emoji="🩺"
      title="Gestational Diabetes — What You Need to Know"
      subtitle="Managing blood sugar protects both you and your baby"
      accentColor="#E07B5F"
      defaultOpen={true}
      items={[
        {
          icon: '🍬',
          title: 'Effect on Baby',
          body: 'High blood sugar crosses the placenta — the baby produces extra insulin, which causes excessive growth (macrosomia), increasing birth complications and the baby\'s future diabetes risk.',
        },
        {
          icon: '🥗',
          title: 'Eat Complex Carbohydrates',
          body: 'Choose whole grains, oats, and legumes over refined carbs. Always combine carbohydrates with protein or healthy fats to slow glucose absorption.',
        },
        {
          icon: '🚫',
          title: 'Avoid Glucose Spikes',
          body: 'Avoid sugar, fruit juices, soft drinks, and ultra-processed foods. Never eat sugar on an empty stomach. Pair fruit with protein.',
        },
        {
          icon: '🚶',
          title: 'Move After Meals',
          body: 'A 10–15 minute walk after eating reduces blood sugar spikes significantly. Aim for 150 minutes of activity per week.',
        },
        {
          icon: '🩸',
          title: 'Monitor Regularly',
          body: 'Check blood sugar as directed by your healthcare provider. Attend all screenings — early detection allows for earlier control.',
        },
        {
          icon: '💊',
          title: 'Key Nutrients',
          body: 'Magnesium, omega-3, and vitamin D all improve insulin sensitivity. Fermented foods support the gut microbiome which affects metabolic health.',
        },
      ]}
      conclusion="Your food choices directly control how much glucose your baby receives. Stable blood sugar through this protocol protects your baby's growth, birth weight, and long-term health."
    />
  )
}

// ── 6. Sleeping Close to Mother ──────────── Postpartum / Recovery page
export function MotherBabyClosenessBox() {
  return (
    <InfoBox
      id="mother-baby-closeness"
      emoji="👶"
      title="Sleeping Close to the Mother After Birth"
      subtitle="Closeness after birth is not just emotional — it is a biological system that actively supports your baby's development"
      accentColor="#A8C5A0"
      items={[
        {
          icon: '❤️',
          title: 'Biological Synchronization',
          body: "When your baby sleeps close to you, their heart rate can synchronize with yours, breathing becomes more stable, and body temperature regulates better. This is called physiological co-regulation — your baby uses your body as a biological guide.",
        },
        {
          icon: '🧠',
          title: 'Brain & Nervous System Development',
          body: 'Close contact supports faster nervous system maturation, reduced stress hormone (cortisol), and improved emotional regulation later in life. Babies feel safer → less energy spent on stress → more energy for growth.',
        },
        {
          icon: '🍼',
          title: 'Breastfeeding Optimization',
          body: 'When the baby sleeps near you, feeding happens more naturally, milk production increases through hormonal response, and the baby feeds more frequently for better nutrition. Night proximity especially boosts prolactin — the milk hormone.',
        },
        {
          icon: '🛡️',
          title: 'Immune System Benefits',
          body: 'Closer contact means exposure to your microbiome, which strengthens immune system development and may reduce infection risks in early life.',
        },
        {
          icon: '😴',
          title: 'Sleep Quality (Both Mother & Baby)',
          body: 'Babies wake less in distress, have a faster calming response, and more stable sleep cycles when near the mother. The first 3–6 months show the strongest impact, with benefits continuing through 6–12 months of room-sharing.',
        },
        {
          icon: '⚠️',
          title: 'Important Safety Note',
          body: "Room-sharing (baby sleeps in own crib next to you) is the safer recommendation. Avoid soft mattresses, heavy blankets, and overheating. Same-bed co-sleeping carries increased risk if not done with careful safety measures.",
        },
      ]}
      conclusion="Your presence acts as a regulation system for your baby — heart rate, breathing, temperature, and stress response. This early synchronization helps build a more stable and resilient system long-term. 🧠"
    />
  )
}

// ── 7. Early Brain Development ──────────── Journey / Recovery page
export function EarlyBrainDevelopmentBox() {
  return (
    <InfoBox
      id="early-brain-development"
      emoji="🧠"
      title="Early Brain Development System (Age 1–5)"
      subtitle="Support natural intelligence, language, and emotional development through targeted age-matched activities"
      accentColor="#8B85C1"
      items={[
        {
          icon: '🟡',
          title: 'Age 1–2 — Foundation Phase',
          body: "Brain focus: sensory development, motor skills, first language patterns. Activities: object naming (repeat simple words daily), shape sorting toys, music and rhythm clapping, mirror play. At this stage the brain creates over 1 million neural connections per second — repetition equals stronger brain wiring.",
        },
        {
          icon: '🟠',
          title: 'Age 2–3 — Language Explosion Phase',
          body: 'Brain focus: vocabulary growth, pattern recognition, simple problem solving. Activities: simple puzzles (2–6 pieces), asking "Where is…?" questions, storytelling with pictures, matching games. Children start forming conceptual understanding rather than just memorizing — this builds communication skills and early logic.',
        },
        {
          icon: '🔵',
          title: 'Age 3–4 — Cognitive Expansion Phase',
          body: "Brain focus: imagination, emotional intelligence, cause-and-effect understanding. Activities: role play (doctor, shop, family), encouraging 'why' questions, memory games, building blocks. Imaginative play activates the prefrontal cortex — important for decision making later in life.",
        },
        {
          icon: '🟢',
          title: 'Age 4–5 — Pre-Kindergarten Optimization',
          body: 'Brain focus: logical thinking, attention span, early academic skills. Activities: counting games, simple strategy games, drawing combined with storytelling, prediction games ("What happens next?"). This phase builds executive functions — attention, planning, decision-making — for school readiness.',
        },
        {
          icon: '⚡',
          title: 'High-Impact Factors (Often Unknown)',
          body: "Talking matters more than toys — children learn more from interaction than from objects. Repetition is key — the same activity repeated builds stronger brain pathways. Emotional safety enables intelligence growth — stress reduces learning ability. Sleep is critical — memory and learning consolidation happen during sleep. Movement grows the brain — physical activity improves cognitive function.",
        },
        {
          icon: '✅',
          title: 'System Insight',
          body: 'Early intelligence is not trained like school knowledge. It is built through timing, repetition, emotion, and interaction. The goal is to match activity to age, rotate daily tasks, explain what each activity develops, and adapt difficulty over time.',
        },
      ]}
      conclusion="Early intelligence is not trained like school knowledge. It is built through timing, repetition, emotion, and interaction — starting from birth. 👶"
    />
  )
}
