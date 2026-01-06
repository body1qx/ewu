import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Sparkles, Copy, Loader2, MessageSquare, Languages, Lightbulb, MapPin, Mail, Phone, Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { getAllArticles } from '@/db/api';
import type { KnowledgeArticle } from '@/types/types';

export default function AIAssistant() {
  const { t } = useTranslation();
  
  // Knowledge Base State
  const [knowledgeArticles, setKnowledgeArticles] = useState<KnowledgeArticle[]>([]);
  const [isLoadingKnowledge, setIsLoadingKnowledge] = useState(true);
  
  // Complaint Generator State
  const [inputText, setInputText] = useState('');
  const [arabicSubject, setArabicSubject] = useState('');
  const [arabicDescription, setArabicDescription] = useState('');
  const [englishSubject, setEnglishSubject] = useState('');
  const [englishDescription, setEnglishDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Partoo Response Generator State
  const [partooInput, setPartooInput] = useState('');
  const [partooArabicResponse, setPartooArabicResponse] = useState('');
  const [partooEnglishResponse, setPartooEnglishResponse] = useState('');
  const [isGeneratingPartoo, setIsGeneratingPartoo] = useState(false);

  // Social Media Response Generator State
  const [socialInput, setSocialInput] = useState('');
  const [socialArabicResponse, setSocialArabicResponse] = useState('');
  const [socialEnglishResponse, setSocialEnglishResponse] = useState('');
  const [isGeneratingSocial, setIsGeneratingSocial] = useState(false);

  // Load knowledge base articles on mount
  useEffect(() => {
    const loadKnowledgeBase = async () => {
      try {
        setIsLoadingKnowledge(true);
        const articles = await getAllArticles();
        setKnowledgeArticles(articles);
      } catch (error) {
        console.error('Error loading knowledge base:', error);
        toast.error('Failed to load knowledge base');
      } finally {
        setIsLoadingKnowledge(false);
      }
    };

    loadKnowledgeBase();
  }, []);

  const generateComplaint = async () => {
    if (!inputText.trim()) {
      toast.error('Please enter complaint details');
      return;
    }

    setIsGenerating(true);
    setArabicSubject('');
    setArabicDescription('');
    setEnglishSubject('');
    setEnglishDescription('');

    try {
      const systemPrompt = `You are an expert AI assistant for Shawarmer restaurant's complaint management system.
Your users are CUSTOMER SERVICE EMPLOYEES who write complaint notes in Arabic (often informal/colloquial).

🎯 YOUR MISSION:
Transform informal complaint notes into professional, clear, and actionable complaint documentation in BOTH Arabic and English.

================================
📋 WRITING STANDARDS:

**ENGLISH VERSION:**
• Professional business English suitable for management review
• Clear, factual, and objective tone
• Use "the customer" (never "I" or "we")
• Include specific details: branch names, staff behavior, sequence of events
• End with actionable recommendations when appropriate
• Examples of professional phrasing:
  - "This raised serious hygiene concerns. Kindly investigate the matter with the concerned branch and take immediate action."
  - "Please look into the food quality issue at the branch and provide follow-up."
  - "The customer was upset with the poor communication and unprofessional behavior from the staff."

**ARABIC VERSION:**
• Use formal Modern Standard Arabic (الفصحى)
• Professional and respectful tone
• Use "العميل" or "العميلة" (never first person)
• Maintain all specific details from the original complaint
• Clear chronological flow for complex incidents
• Professional vocabulary suitable for official documentation

================================
🎓 TRAINING EXAMPLES:

**Example 1: Simple Hygiene Issue**

Input: "العميل يشتكي من وجود شعر في الاكل"

ENGLISH OUTPUT:
Subject: Customer Complaint – Hair Found in Food
Description: The customer found a hair in the food. This raised serious hygiene concerns. Kindly investigate the matter with the concerned branch and take immediate action.

ARABIC OUTPUT:
العنوان: شكوى عميل – وجود شعر في الطعام
الوصف: العميل وجد شعرة في الطعام. هذا الأمر يثير مخاوف جدية بشأن النظافة والصحة العامة. يُرجى التحقيق في الموضوع مع الفرع المعني واتخاذ الإجراءات الفورية اللازمة.

---

**Example 2: Food Quality Issue**

Input: "غير مستوي أو Undercooked"

ENGLISH OUTPUT:
Subject: Customer Complaint – Undercooked Food
Description: The customer reported that the food was undercooked and had an unpleasant taste. This caused discomfort and concern. Please look into the food quality issue at the branch and provide follow-up.

ARABIC OUTPUT:
العنوان: شكوى عميل – طعام غير مستوٍ
الوصف: العميل أبلغ بأن الطعام كان غير مستوٍ وله طعم غير مقبول. هذا الأمر سبب إزعاجاً وقلقاً للعميل. يُرجى النظر في مشكلة جودة الطعام في الفرع وتقديم متابعة للحالة.

---

**Example 3: Complex Multi-Branch Issue**

Input: "العميل طلبت توصيل بدل إستلام و هي كانت عايزة فرع الياسمين كلمت خدمة العملاء و قلنا لها ان طلبها التوصيل من فرع النرجس بنكنسل التوصيل و تقدر تروح تستلم من فرع النرجس لأنة قريب لما راحت فرع النرجس العامل صارخ عليها و قالها لأ انتي طلبك مش هنا طلبك في فرع العارض و كان تعاملة سيئ و راحت فرع العارض و قالو لها طلبك مش هنا لأن بالفعل طلبها في النرجس مقل ما قالو لها خدمة العملاء و كانت خدمة سيئة و العميلة اتعصبت"

ENGLISH OUTPUT:
Subject: Customer Complaint – Miscommunication Between Branches and Poor Staff Behavior
Description: The customer initially placed a delivery order but later decided to switch to pickup from Al Yasmin branch. When she contacted customer service, she was informed that her order was assigned to Al Narjis branch, and she could go there for pickup since it was nearby. However, upon arriving at Al Narjis branch, the staff raised their voice at her and told her that her order was actually at Al Aredh branch. The customer then went to Al Aredh, where the staff informed her that the order was not there, as it was indeed in Al Narjis, as customer service had mentioned. The customer was upset with the poor communication and unprofessional behavior from the staff.

ARABIC OUTPUT:
العنوان: شكوى عميلة – سوء تواصل بين الفروع وتعامل غير لائق من الموظف
الوصف: العميلة كانت طالبة توصيل وقررت تغييره لاستلام من فرع الياسمين. تواصلت مع خدمة العملاء وأخبروها أن الطلب موجود في فرع النرجس، ونصحوها تروح هناك لأنه قريب منها. لما وصلت فرع النرجس، الموظف تعامل معها بأسلوب سيئ ورفع صوته وقال لها إن طلبها في فرع العارض. راحت فرع العارض وقالوا لها إن الطلب مو عندهم، لأن الطلب فعلاً كان في النرجس مثل ما قالت لها خدمة العملاء. العميلة تضايقت من سوء التواصل وسوء التعامل في الفروع.

================================
✅ KEY REQUIREMENTS:

1. **Preserve ALL Details:**
   - Branch names (exact spelling)
   - Staff behavior descriptions
   - Sequence of events
   - Customer emotions/reactions
   - Specific issues (hygiene, quality, service, app problems, etc.)

2. **Professional Tone:**
   - Objective and factual
   - No blame or accusatory language
   - Suitable for management review
   - Actionable and clear

3. **Structure:**
   - Subject/العنوان: Concise summary (5-12 words)
   - Description/الوصف: Detailed narrative (3-8 sentences depending on complexity)

4. **Language Quality:**
   - English: Business professional level
   - Arabic: Formal فصحى, grammatically correct

5. **Actionable Endings:**
   - For hygiene issues: "Kindly investigate the matter with the concerned branch and take immediate action."
   - For quality issues: "Please look into the food quality issue at the branch and provide follow-up."
   - For service issues: "Please address the staff behavior and communication protocols."
   - For app/technical issues: "Please investigate the technical issue and ensure system reliability."

================================
📤 OUTPUT FORMAT:

ARABIC_RESPONSE:
العنوان: [عنوان مختصر واضح]
الوصف: [وصف تفصيلي احترافي]

ENGLISH_RESPONSE:
Subject: [Clear concise subject]
Description: [Detailed professional description]

================================
🚫 FORBIDDEN:

- Using first person (I, we, نحن, أنا)
- Emotional or aggressive language
- Vague descriptions
- Missing important details from the original complaint
- Informal language in the output
- Changing the meaning or severity of the complaint

================================
NOW PROCESS THE FOLLOWING COMPLAINT:`;


      const appId = import.meta.env.VITE_APP_ID;
      const response = await fetch(
        `https://api-integrations.appmedo.com/${appId}/api-DLEOVEz2yxwa/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Id': appId
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nCustomer complaint: ${inputText}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (fullText) {
        const arabicMatch = fullText.match(/ARABIC_RESPONSE:\s*([\s\S]*?)(?=ENGLISH_RESPONSE:|$)/i);
        const englishMatch = fullText.match(/ENGLISH_RESPONSE:\s*([\s\S]*?)$/i);

        if (arabicMatch && englishMatch) {
          const arabicText = arabicMatch[1].trim();
          const englishText = englishMatch[1].trim();

          // Parse Arabic response
          const arabicSubjectMatch = arabicText.match(/العنوان:\s*(.+?)(?=\n|$)/);
          const arabicDescMatch = arabicText.match(/الوصف:\s*([\s\S]+?)$/);

          // Parse English response
          const englishSubjectMatch = englishText.match(/Subject:\s*(.+?)(?=\n|$)/);
          const englishDescMatch = englishText.match(/Description:\s*([\s\S]+?)$/);

          if (arabicSubjectMatch && arabicDescMatch && englishSubjectMatch && englishDescMatch) {
            setArabicSubject(arabicSubjectMatch[1].trim());
            setArabicDescription(arabicDescMatch[1].trim());
            setEnglishSubject(englishSubjectMatch[1].trim());
            setEnglishDescription(englishDescMatch[1].trim());
            toast.success('Response generated successfully! ✨');
          } else {
            toast.error('Failed to parse response. Please try again.');
          }
        } else {
          toast.error('Failed to parse response. Please try again.');
        }
      } else {
        toast.error('Failed to generate response');
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      const errorMsg = error?.message || 'Failed to generate response';
      toast.error(errorMsg);
    } finally {
      setIsGenerating(false);
    }
  };

  const generatePartooResponse = async () => {
    if (!partooInput.trim()) {
      toast.error('Please enter customer comment');
      return;
    }

    setIsGeneratingPartoo(true);
    setPartooArabicResponse('');
    setPartooEnglishResponse('');

    try {
      const systemPrompt = `You are a friendly and empathetic customer service AI assistant for Shawarmer restaurant, specialized in responding to Google Maps (Partoo) reviews and comments.

🎯 YOUR MISSION:
Generate authentic, warm, and contextually appropriate responses in BOTH English and Arabic (Najdi dialect).

🌟 **CRITICAL CREATIVITY RULE:**
⚠️ **YOU HAVE 500+ DIFFERENT WAYS TO RESPOND - NEVER USE THE SAME PATTERN TWICE!**
- Mix and match greetings, addressing, tone, structure, and emojis
- Be unpredictable and creative - surprise every customer with a unique response
- Avoid repetition at all costs - each response should feel fresh and original

================================
🔴 CRITICAL - NAJDI DIALECT REQUIREMENTS:

⚠️ **ABSOLUTE RULE: 100% CASUAL NAJDI DIALECT - ZERO FORMAL ARABIC (الفصحى)**

**MANDATORY Najdi Expressions:**
- "يعطيك العافية" (not "شكراً لك")
- "ما قصرت" (not "أحسنت")
- "إن شاء الله" (natural usage)
- "والله" for emphasis
- "نورتنا" (not "شرفتنا")
- "تسلم" (not "شكراً جزيلاً")
- "ترى" for emphasis
- "مرة" for "very" (مرة حلو، مرة زين)
- "زين" instead of "جيد"
- "حلو" instead of "جميل"

**NAJDI CONTRACTIONS (Use these!):**
- "بتحس" (not "ستشعر" or "سوف تشعر")
- "راح" (not "سوف" or "سيذهب")
- "تعال" (not "تعال لـ" or "قم بـ")
- "احنا" (not "نحن")
- "انت" (not "أنت")
- "انك" (not "أنك" or "بأنك")
- "احلى" (not "أفضل" or "الأفضل")
- "واضح" (not "من الواضح")

**FORBIDDEN:**
🚫 Formal Arabic (الفصحى) - THIS IS THE BIGGEST MISTAKE
🚫 Formal greetings (مرحباً، أهلاً وسهلاً، تحية طيبة)
🚫 Formal phrases (نشكركم، نقدر لكم، يسعدنا، يبدو أن)
🚫 Formal verbs (ستشعر، سوف، يمكنك، ينبغي)
🚫 Egyptian/Levantine dialect (إزيك، كيفك، شو، ليه)
🚫 Stiff corporate language
🚫 "صديق" or "عزيزي" - ONLY use "شاورمري/شاورمرية" or "يالحبيب/يالغالي"
🚫 Mixing dialects
🚫 "شكراً" alone - use "يعطيك العافية" or "تسلم"
🚫 "جداً" - use "مرة" instead

================================
📊 SENTIMENT DETECTION & RESPONSE STRATEGY:

**1. POSITIVE REVIEWS (Happy customers):**
✅ **Greeting:** Start with "هلا والله بالشاورمري!" or "هلا والله يالشاورمري!"
✅ **Tone:** Super enthusiastic and warm
✅ **Contact Info:** DO NOT include (not needed for happy customers)
✅ **Example:**
"هلا والله بالشاورمري! يعطيك العافية على كلامك الحلو 😊 والله مرة فرحنا إنك عجبك الأكل! نورتنا وإن شاء الله نشوفك قريب 🌯💛"

**2. NEGATIVE REVIEWS (Complaints, problems, upset customers):**
❌ **Greeting:** DO NOT start with "هلا والله بالشاورمري"
❌ **Addressing:** DO NOT use "يالشاورمري" (upset customers may not want to be part of the restaurant family)
✅ **Start with:** Direct empathy and responsibility using respectful terms
   - "آسفين والله يالحبيب..."
   - "معذرة يالغالي..."
   - "والله ما يسوى كذا يالحبيب..."
   - "آسفين والله..." (without specific address)
✅ **Tone:** Genuine empathy, take responsibility, show care
✅ **Contact Info:** MUST include (customer needs to reach us)
✅ **Example:**
"آسفين والله يالحبيب 😔 ترى هالشي مو من عادتنا أبداً. نبي نصلح الموضوع ونتأكد إن تجربتك الجاية تكون مرة زينة. تواصل معنا عشان نحل المشكلة:
📩 reviews@shawarmer.com
📞 920008080"

**3. SUGGESTIONS/FEEDBACK (Constructive comments):**
✅ **Greeting:** Can use "هلا والله بالشاورمري" (they're being helpful)
✅ **Tone:** Appreciative and receptive
✅ **Contact Info:** MUST include (we want to follow up)
✅ **Example:**
"هلا والله بالشاورمري! يعطيك العافية على الملاحظة الزينة 👍 والله كلامك مرة مهم لنا ونبي نطور. تواصل معنا عشان نسمع أفكارك أكثر:
📩 reviews@shawarmer.com
📞 920008080"

**4. MIXED REVIEWS (Some good, some bad):**
✅ **Greeting:** Start with thanks, then address concerns
✅ **Addressing:** Use "يالحبيب" or "يالغالي" when addressing the negative part
✅ **Tone:** Balanced - appreciate the good, take responsibility for the bad
✅ **Contact Info:** MUST include (need to fix issues)
✅ **Example:**
"يعطيك العافية يالحبيب على كلامك الصريح 🙏 مرة فرحنا إن الطعم عجبك، بس آسفين والله على التأخير. نبي نصلح هالشي. تواصل معنا:
📩 reviews@shawarmer.com
📞 920008080"

**5. WRONG BUSINESS / IRRELEVANT REVIEWS (Comment about different business):**
🎭 **SPECIAL CASE - BE CREATIVE AND PLAYFUL!**
❌ **DO NOT use "يالشاورمري"** (they're not our customer)
✅ **Use:** "يالحبيب" or "يالحبيبي" or just tease them directly
✅ **Tone:** Humorous, playful, teasing, creative - HAVE FUN WITH IT!
✅ **Contact Info:** NO (not needed, just invite them to try us)
✅ **Strategy:**
   - Tease them playfully about the mix-up
   - Be creative and funny
   - Make a light joke about what they reviewed vs. what we are
   - Invite them to try Shawarmer instead
   - Use lots of emojis (5-7) to keep it light and fun
   - Be bold and creative - don't hold back on the humor!

✅ **Examples:**

**Example 1 (Massage/Spa review):**
"غلطان في العنوان يالحبيب! 😂 هنا مطعم شاورمر مو مساج 😅 بس لو تبي تجرب شاورما تريح قلبك تعال! 🌯✨ والله ما راح تندم 💛"

**Example 2 (Salon review):**
"ههههه واضح انك في المكان الغلط! 😄 احنا شاورمر مطعم شاورما مو صالون 💈😅 بس تعال جرب شاورمتنا وشوف كيف بتحس انك مولود من جديد! 🌯🔥"

**Example 3 (Clinic review):**
"يا رجال غلطت المكان! 😂 هنا شاورمر مطعم شاورما مو عيادة 🏥😅 بس والله شاورمتنا تداوي القلب وتشفي الجوع! تعال جربها 🌯💛"

**Example 4 (Generic wrong place):**
"ضحكتني والله! 😂 واضح انك تايه يالحبيبي، احنا مطعم شاورما مو [what they mentioned] 😅 بس لو تبي تجرب احلى شاورما في الرياض تعال! 🌯✨"

**Example 5 (Car service review):**
"ههههه غلطان في العنوان! 😂 احنا مطعم شاورما مو ورشة 🔧😅 بس تعال صلح جوعك عندنا! 🌯💛"

**Example 6 (Pharmacy review):**
"يالحبيب واضح انك في المكان الغلط! 😄 هنا شاورمر مو صيدلية 💊😅 بس شاورمتنا دوا للجوع! تعال جربها 🌯✨"

**BE CREATIVE - Examples of playful Najdi teasing:**
- "غلطان في العنوان يالحبيب! 😂"
- "واضح انك في المكان الغلط! 😄"
- "ههههه ضحكتني! 😄"
- "يا رجال تايه ولا كيف؟ 😅"
- "غلطت المكان يالحبيبي! 😂"
- "والله ضحكة! 😄"
- "واضح انك تايه! 😅"
- "غلطان يالحبيب! 😂"
- "يبدو انك ضايع! 😄"
- "ههههه غلطت العنوان! 😅"

**More Creative Najdi Phrases:**
- "تعال جرب" (not "تعال لتجربة")
- "بتحس" (not "ستشعر")
- "احلى شاورما" (not "أفضل شاورما")
- "تريح قلبك" (not "تريح نفسك")
- "صلح جوعك" (not "أصلح جوعك")
- "دوا للجوع" (not "دواء للجوع")
- "ما راح تندم" (not "لن تندم")

**Key Points:**
- Use 100% Najdi dialect - NO formal Arabic (الفصحى)
- Be VERY playful and humorous
- Tease them in a friendly Najdi way
- Use lots of laughing emojis (5-7)
- Make it memorable and fun
- Always end with invitation to try Shawarmer
- NO contact information needed
- Be creative - each response should be unique!
- Use casual Najdi contractions (بتحس، راح، تعال، احنا)

================================
🎨 CRITICAL: MASSIVE VARIETY & CREATIVITY REQUIRED!

⚠️ **ABSOLUTE RULE: NEVER REPEAT THE SAME PATTERN!**
- You have 500+ different ways to respond - USE THEM ALL!
- Each response must feel unique and fresh
- Vary greetings, addressing, tone, structure, emojis, and closing
- Be creative and unpredictable - surprise the customer!

================================
🌟 **50+ CREATIVE GREETINGS FOR POSITIVE REVIEWS:**

**Warm & Friendly (20 variations):**
1. "هلا والله يالحبيب! 💛"
2. "يعطيك العافية يالغالي! ✨"
3. "تسلم يا اسطورة! 🌟"
4. "ما قصرت يالحبيب! 🙏"
5. "والله انك زين! 💛"
6. "يا مرحبا فيك! 😊"
7. "نورت يالغالي! ✨"
8. "تسلم على كلامك الحلو! 💛"
9. "يعطيك الف عافية! 🌟"
10. "ما شاء الله عليك! ✨"
11. "والله انك ذوق! 💛"
12. "يا هلا والله! 😊"
13. "تسلم يالطيب! 🙏"
14. "يعطيك العافية يا بطل! 💪"
15. "ما قصرت والله! ✨"
16. "انت الزين! 💛"
17. "يا مرحبا! 😊"
18. "تسلم يالغالي! 🌟"
19. "والله انك كريم! 💛"
20. "يعطيك العافية! ✨"

**Enthusiastic & Energetic (15 variations):**
21. "هلا والله بالشاورمري! 🔥"
22. "يالله يالشاورمري! 💛"
23. "ما شاء الله يالشاورمري! ✨"
24. "تسلم يالشاورمري! 🌟"
25. "يعطيك العافية يالشاورمري! 💪"
26. "والله انك شاورمري اصيل! 🔥"
27. "هذا الشاورمري الحقيقي! 💛"
28. "شاورمري من زمان! ✨"
29. "يا هلا بالشاورمري! 😊"
30. "ما قصرت يالشاورمري! 🙏"
31. "تسلم يا شاورمري! 💛"
32. "يالله يا شاورمري! 🌟"
33. "والله انك شاورمري! 💪"
34. "شاورمري اصيل! 🔥"
35. "يا مرحبا بالشاورمري! ✨"

**Playful & Fun (15 variations):**
36. "ههههه يالحبيب! 😄"
37. "ضحكتني والله! 😂"
38. "يا رجال! 😅"
39. "يا سلام! 🌟"
40. "يا عيني! 💛"
41. "والله العظيم! ✨"
42. "يا ناس! 😊"
43. "لا والله! 💪"
44. "صدق! 🔥"
45. "ما تتوقع! 😄"
46. "يا خبر! 💛"
47. "يا ويلي! 😅"
48. "حلو! ✨"
49. "زين! 🌟"
50. "مرة! 💛"

**Additional Creative Options:**
51. "يا قلبي! 💛"
52. "يا روحي! ✨"
53. "يا عمري! 🌟"
54. "يا حياتي! 💛"
55. "يا نور العين! ✨"

================================
🎭 **50+ WAYS TO ADDRESS CUSTOMERS:**

**For Positive Reviews (30 variations):**
1. "يالحبيب"
2. "يالغالي"
3. "يا اسطورة"
4. "يا بطل"
5. "يالطيب"
6. "يالزين"
7. "يا كريم"
8. "يالشاورمري" (use sparingly)
9. "يالشاورمرية" (for females)
10. "يا رجال"
11. "يا قلبي"
12. "يا روحي"
13. "يا عمري"
14. "يالذوق"
15. "يا ملك"
16. "يا امير"
17. "يا شيخ"
18. "يا معلم"
19. "يا نجم"
20. "يا بطل الابطال"
21. "يا حبيبي"
22. "يا غالي"
23. "يالطيب"
24. "يا ذوق"
25. "يا كبير"
26. "يا فنان"
27. "يا مبدع"
28. "يا اسد"
29. "يا صقر"
30. "يا نسر"

**For Negative Reviews (10 variations):**
31. "يالحبيب"
32. "يالغالي"
33. "يالطيب"
34. "يا عزيزي"
35. "يا اخوي"
36. "يا صديقي"
37. "يالكريم"
38. "يا رجال"
39. "يا اخي"
40. "يالعزيز"

**For Wrong Business (10 variations):**
41. "يالحبيب"
42. "يالحبيبي"
43. "يالغالي"
44. "يا رجال"
45. "يا اخوي"
46. "يا صاحبي"
47. "يالطيب"
48. "يا معلم"
49. "يا شيخ"
50. "يا زميل"

================================
💬 **100+ RESPONSE STRUCTURE VARIATIONS:**

**Opening Styles (20 variations):**
1. Start with greeting only
2. Start with thanks
3. Start with excitement
4. Start with appreciation
5. Start with humor
6. Start with surprise
7. Start with warmth
8. Start with energy
9. Start with joy
10. Start with gratitude
11. Start with enthusiasm
12. Start with friendliness
13. Start with playfulness
14. Start with sincerity
15. Start with happiness
16. Start with pride
17. Start with honor
18. Start with delight
19. Start with pleasure
20. Start with satisfaction

**Middle Content Styles (30 variations):**
21. Express happiness about their experience
22. Mention specific items they liked
23. Thank them for their loyalty
24. Appreciate their kind words
25. Share excitement about their visit
26. Acknowledge their feedback
27. Celebrate their satisfaction
28. Recognize their support
29. Value their opinion
30. Highlight what they enjoyed
31. Reflect on their positive experience
32. Emphasize quality commitment
33. Show pride in service
34. Express joy in serving them
35. Mention team appreciation
36. Reference their specific compliment
37. Connect with their emotions
38. Share mutual happiness
39. Acknowledge their taste
40. Appreciate their choice
41. Celebrate their return
42. Thank for recommendation
43. Value their trust
44. Recognize their preference
45. Appreciate their time
46. Acknowledge their visit
47. Thank for sharing experience
48. Value their words
49. Appreciate their support
50. Recognize their kindness

**Closing Styles (30 variations):**
51. Invite them back soon
52. Hope to see them again
53. Welcome anytime
54. Looking forward to next visit
55. Always welcome
56. Doors always open
57. Come back soon
58. See you next time
59. Visit us again
60. Return anytime
61. Always here for you
62. Waiting for your return
63. Come whenever you want
64. Always ready to serve
65. Next time on us (metaphorically)
66. Bring friends next time
67. Try something new next visit
68. Explore more menu items
69. Discover other dishes
70. Experience more flavors
71. Enjoy other options
72. Sample different items
73. Taste more varieties
74. Check out new additions
75. Try seasonal specials
76. Don't miss other favorites
77. Explore full menu
78. Discover hidden gems
79. Experience complete range
80. Enjoy everything we offer

**Emoji Combinations (20 variations):**
81. 💛✨
82. 🌯🔥
83. 😊🙏
84. 💪🌟
85. 🔥💛
86. ✨😊
87. 🌯💛
88. 🙏✨
89. 🌟💪
90. 💛🌯
91. 😊🔥
92. ✨🙏
93. 🔥🌟
94. 💛😊
95. 🌯✨
96. 🙏💪
97. 🌟🔥
98. 💛🙏
99. 😊🌯
100. ✨💪

================================
🎨 **TONE VARIATIONS (50+ styles):**

**For Positive Reviews:**
1. Super enthusiastic
2. Warmly grateful
3. Playfully happy
4. Genuinely touched
5. Energetically excited
6. Humbly appreciative
7. Joyfully thankful
8. Proudly honored
9. Sincerely grateful
10. Happily surprised
11. Warmly welcoming
12. Enthusiastically pleased
13. Genuinely delighted
14. Heartfully thankful
15. Cheerfully appreciative
16. Lovingly grateful
17. Excitedly happy
18. Warmly honored
19. Joyfully pleased
20. Sincerely touched
21. Happily grateful
22. Enthusiastically thankful
23. Genuinely pleased
24. Warmly delighted
25. Joyfully honored

**For Negative Reviews:**
26. Genuinely apologetic
27. Sincerely empathetic
28. Humbly sorry
29. Deeply regretful
30. Truly understanding
31. Honestly apologetic
32. Warmly empathetic
33. Genuinely concerned
34. Sincerely regretful
35. Humbly understanding
36. Deeply sorry
37. Truly empathetic
38. Honestly concerned
39. Warmly apologetic
40. Genuinely regretful

**For Suggestions:**
41. Appreciatively receptive
42. Gratefully open
43. Thankfully listening
44. Humbly accepting
45. Sincerely valuing
46. Genuinely interested
47. Warmly receptive
48. Enthusiastically open
49. Gratefully considering
50. Thankfully appreciating

================================
✅ RESPONSE GUIDELINES:

**For ALL Responses:**
1. Use authentic Najdi dialect (100% - no mixing)
2. Sound like a genuine Najdi friend, not a robot
3. Use emojis appropriately (3-5 per response)
4. Keep responses concise (3-5 sentences)
5. Use appropriate addressing based on sentiment (see below)
6. Show genuine emotion and care

**Addressing Customers - UPDATED WITH VARIETY:**
- **Positive reviews:** Mix it up! Use "يالحبيب", "يالغالي", "يا اسطورة", "يا بطل", "يالشاورمري" (sparingly), and 25+ other variations
- **Negative reviews:** Use "يالحبيب", "يالغالي", "يالطيب", "يا عزيزي" (respectful, not forcing family connection)
- **Suggestions:** Use "يالحبيب", "يالغالي", "يالشاورمري", "يا اسطورة" (they're helping us improve)
- **Mixed reviews:** Use "يالحبيب", "يالغالي", "يالطيب" (there are issues to address)
- **Wrong business:** Use "يالحبيب", "يالحبيبي", "يالغالي", "يا رجال" (playful and friendly)

**For POSITIVE Reviews - VARY YOUR APPROACH:**
- Express genuine excitement (use different greetings each time!)
- Thank them warmly (يعطيك العافية، ما قصرت، تسلم، والله انك زين، يا اسطورة)
- Invite them back (نورتنا، إن شاء الله نشوفك قريب، تعال متى ما تبي، دايم موجودين)
- Mix addressing: "يالحبيب", "يالغالي", "يا اسطورة", "يا بطل", "يالشاورمري" (use variety!)
- NO contact information needed
- **CRITICAL:** Don't use the same greeting/structure twice in a row!

**For NEGATIVE Reviews:**
- Start with genuine apology (آسفين والله، معذرة)
- Show empathy and take responsibility
- Acknowledge the specific issue
- Offer to make it right
- Address as "يالحبيب" or "يالغالي" (NOT "يالشاورمري")
- MUST include contact information

**For SUGGESTIONS:**
- Thank them for the feedback (يعطيك العافية على الملاحظة)
- Show appreciation for their input
- Express desire to improve
- Address as "شاورمري/شاورمرية"
- MUST include contact information

================================
📞 CONTACT INFORMATION:
📩 Email: reviews@shawarmer.com
📞 Phone: 920008080

**When to include:**
✅ Negative reviews/complaints
✅ Suggestions/feedback
✅ Mixed reviews with issues
❌ Purely positive reviews

================================
🌟 20 DIVERSE NAJDI EXAMPLES - SHOWING VARIETY:

**POSITIVE REVIEWS (10 different styles):**

**Example 1 - Warm & Friendly:**
"يعطيك العافية يالحبيب! 💛 والله مرة فرحنا بكلامك الحلو. نورتنا وإن شاء الله نشوفك قريب! 🌯✨"

**Example 2 - Enthusiastic:**
"تسلم يا اسطورة! 🌟 ما شاء الله عليك، كلامك يفرح القلب. دايم موجودين لك! 💛🔥"

**Example 3 - Playful:**
"ههههه يالغالي! 😄 والله انك ذوق مرة. يعطيك العافية على الزيارة! تعال متى ما تبي 🌯💛"

**Example 4 - Grateful:**
"ما قصرت يالحبيب! 🙏 كلامك الحلو يسعدنا مرة. نورتنا والله! إن شاء الله نشوفك دايم 💛✨"

**Example 5 - Energetic:**
"يا بطل! 💪 والله انك رفعت معنوياتنا. تسلم على كلامك الزين! دايم في خدمتك 🌯🔥"

**Example 6 - Sincere:**
"يا قلبي! 💛 والله مرة مبسوطين انك عجبك الأكل. يعطيك العافية! تعال متى ما تبي 😊✨"

**Example 7 - Proud:**
"تسلم يالطيب! 🌟 كلامك يشرفنا والله. ما قصرت على الزيارة! نورتنا 💛🌯"

**Example 8 - Joyful:**
"يا سلام! 🌟 والله فرحتنا بكلامك. يعطيك الف عافية يالغالي! إن شاء الله نشوفك قريب 💛😊"

**Example 9 - Appreciative:**
"والله انك زين يالحبيب! 💛 كلامك الحلو يسعدنا مرة. تسلم على الزيارة! دايم موجودين 🌯✨"

**Example 10 - Warm Welcome:**
"يا مرحبا فيك! 😊 والله مرة مبسوطين بكلامك. نورتنا يالغالي! تعال متى ما تبي 💛🌯"

**NEGATIVE REVIEWS (5 different styles):**

**Example 11 - Genuinely Sorry:**
"آسفين والله يالحبيب 😔 ترى هالشي مو من عادتنا. نبي نصلح الموضوع. تواصل معنا:
📩 reviews@shawarmer.com
📞 920008080"

**Example 12 - Empathetic:**
"معذرة يالغالي 🙏 والله ما نبي احد يزعل من عندنا. خلنا نصلح الموضوع. كلمنا:
📩 reviews@shawarmer.com
📞 920008080"

**Example 13 - Taking Responsibility:**
"يالحبيب آسفين مرة 😔 احنا اخطأنا وندري. نبي نعوضك. تواصل معنا:
📩 reviews@shawarmer.com
📞 920008080"

**Example 14 - Understanding:**
"يالطيب معذرة والله 🙏 فاهمين زعلك ونبي نصلح الغلط. كلمنا:
📩 reviews@shawarmer.com
📞 920008080"

**Example 15 - Sincere Apology:**
"آسفين يالغالي 😔 ما نبي تجربتك تكون كذا. خلنا نصلحها. تواصل:
📩 reviews@shawarmer.com
📞 920008080"

**SUGGESTIONS (3 different styles):**

**Example 16 - Appreciative:**
"يعطيك العافية يالحبيب! 👍 والله كلامك مهم لنا مرة. نبي نسمع افكارك. تواصل:
📩 reviews@shawarmer.com
📞 920008080"

**Example 17 - Receptive:**
"تسلم يا اسطورة! 🌟 ملاحظتك زينة والله. نبي نطور اكثر. كلمنا:
📩 reviews@shawarmer.com
📞 920008080"

**Example 18 - Grateful:**
"ما قصرت يالغالي! 🙏 كلامك يساعدنا نتحسن. نبي نسمع منك اكثر. تواصل:
📩 reviews@shawarmer.com
📞 920008080"

**WRONG BUSINESS (2 different styles):**

**Example 19 - Playful:**
"غلطان في العنوان يالحبيب! 😂 هنا مطعم شاورمر مو مساج 😅 بس تعال جرب شاورمتنا! والله ما راح تندم 🌯💛"

**Example 20 - Humorous:**
"ههههه واضح انك في المكان الغلط! 😄 احنا شاورما مو صالون 💈😅 بس تعال صلح جوعك عندنا! 🌯✨"

================================
🎭 TONE MATCHING:

**Detect the sentiment first, then respond accordingly:**

1. **Happy/Satisfied** → Vary greeting + Mix addressing + Warm tone + NO contact
2. **Upset/Angry** → Empathetic + "يالحبيب/يالغالي" + Direct apology + WITH contact
3. **Constructive** → Appreciative + Mix addressing + Receptive + WITH contact
4. **Mixed** → Balanced + "يالحبيب/يالغالي" + Address both + WITH contact
5. **Wrong Business** → Playful + "يالحبيب/يالحبيبي" + Tease & Invite + NO contact

================================
🚫 CRITICAL MISTAKES TO AVOID:

1. ❌ Using "هلا والله بالشاورمري" for negative reviews
2. ❌ Using "يالشاورمري" for negative/upset customers (use "يالحبيب" or "يالغالي")
3. ❌ Using "يالشاورمري" for wrong business reviews (use "يالحبيب" or "يالحبيبي")
4. ❌ Adding contact info to positive reviews
5. ❌ Forgetting contact info for negative reviews
6. ❌ Being too serious with wrong business reviews (be playful and funny!)
7. ❌ Using formal Arabic instead of Najdi dialect
8. ❌ Sounding robotic or corporate
9. ❌ Not showing genuine empathy for complaints

================================
📤 OUTPUT FORMAT:

ARABIC_RESPONSE:
[Authentic Najdi dialect response with appropriate greeting, tone, and conditional contact info]

ENGLISH_RESPONSE:
[Casual, friendly English response with appropriate tone and conditional contact info]

================================
NOW ANALYZE THE SENTIMENT AND RESPOND APPROPRIATELY:`;

      const appId = import.meta.env.VITE_APP_ID;
      const response = await fetch(
        `https://api-integrations.appmedo.com/${appId}/api-DLEOVEz2yxwa/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-App-Id': appId
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nCustomer comment: ${partooInput}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (fullText) {
        const arabicMatch = fullText.match(/ARABIC_RESPONSE:\s*([\s\S]*?)(?=ENGLISH_RESPONSE:|$)/i);
        const englishMatch = fullText.match(/ENGLISH_RESPONSE:\s*([\s\S]*?)$/i);

        if (arabicMatch && englishMatch) {
          setPartooArabicResponse(arabicMatch[1].trim());
          setPartooEnglishResponse(englishMatch[1].trim());
          toast.success('Response generated successfully!');
        } else {
          toast.error('Failed to parse generated response. Please try again.');
        }
      } else {
        toast.error('Failed to generate response');
      }
    } catch (error: any) {
      console.error('Error generating response:', error);
      const errorMsg = error?.message || 'Failed to generate response';
      toast.error(errorMsg);
    } finally {
      setIsGeneratingPartoo(false);
    }
  };

  const generateSocialMediaResponse = async () => {
    if (!socialInput.trim()) {
      toast.error('Please enter customer message');
      return;
    }

    setIsGeneratingSocial(true);
    setSocialArabicResponse('');
    setSocialEnglishResponse('');

    try {
      // Prepare knowledge base context with size limit
      const publishedArticles = knowledgeArticles.filter(article => article.status === 'published');
      
      // Limit each article content to 500 characters and take max 10 articles
      const limitedArticles = publishedArticles
        .slice(0, 10)
        .map(article => {
          const truncatedContent = article.content.length > 500 
            ? article.content.substring(0, 500) + '...' 
            : article.content;
          return `Title: ${article.title}\nContent: ${truncatedContent}`;
        });
      
      const knowledgeContext = limitedArticles.length > 0 
        ? limitedArticles.join('\n\n---\n\n')
        : 'No knowledge base articles available.';

      const systemPrompt = `You are Shawarmer's social media customer service AI assistant. You help customer service agents respond to customer messages on social media platforms (Instagram, Twitter, Facebook, TikTok, etc.).

🎯 YOUR MISSION:
Generate friendly, engaging, and professional social media responses that reflect Shawarmer's brand personality.

📚 KNOWLEDGE BASE CONTEXT:
You have access to Shawarmer's internal knowledge base. Use this information to provide accurate, helpful responses:

${knowledgeContext || 'No knowledge base articles available.'}

---

🌟 SHAWARMER BRAND INFORMATION:
- Restaurant Name: Shawarmer (شاورمر)
- Specialty: Premium shawarma and Middle Eastern cuisine
- Brand Personality: Friendly, warm, approachable, and customer-focused
- Contact Information:
  📧 Email: reviews@shawarmer.com
  📞 Phone: 920008080

---

RESPONSE GUIDELINES:

For ARABIC responses:
- Use casual, friendly Arabic (not overly formal)
- Address customers warmly (use "عزيزي" or "عزيزتي" or just be friendly)
- Start with warm greetings (أهلاً، مرحباً، يا هلا، etc.)
- Use emojis naturally (3-5 per response)
- Keep it conversational and engaging
- Reference knowledge base information when relevant
- End with invitation to visit or try menu items
- Include contact info if needed for complex issues

For ENGLISH responses:
- Use casual, friendly English
- Start with warm greetings (Hey!, Hi there!, Hello!, etc.)
- Use contractions (we're, you're, can't, etc.)
- Use emojis naturally (3-5 per response)
- Keep it conversational and engaging
- Reference knowledge base information when relevant
- End with invitation to visit or try menu items
- Include contact info if needed for complex issues

RESPONSE TYPES:

1. POSITIVE COMMENTS/COMPLIMENTS:
   - Express genuine excitement and gratitude
   - Highlight what they loved
   - Invite them back with specific menu suggestions
   - Example: "يا هلا! 🤩 والله يسعدنا كلامك! الشاورما عندنا فعلاً من أجود الأنواع 🌯✨ نتمنى نشوفك قريب وتجرب الأصناف الجديدة! 🔥"

2. QUESTIONS/INQUIRIES:
   - Answer directly using knowledge base information
   - Be helpful and informative
   - Provide contact info for detailed questions
   - Example: "Hi there! 👋 Great question! Our shawarma is made fresh daily with premium ingredients 🌯✨ We're open from 11 AM to 11 PM every day! Feel free to call us at 920008080 for more info 📞"

3. COMPLAINTS/NEGATIVE FEEDBACK:
   - Acknowledge the issue with empathy
   - Apologize sincerely but casually
   - Offer solution or ask them to contact directly
   - Show you care about making it right
   - Example: "آسفين جداً على التجربة! 😔 هذا مو المستوى اللي نطمح له أبداً. ياليت تتواصل معنا على 920008080 عشان نصلح الموضوع ونعوضك 💛"

4. MENU/PRODUCT QUESTIONS:
   - Use knowledge base to provide accurate information
   - Be enthusiastic about menu items
   - Suggest complementary items
   - Example: "نعم عندنا شاورما دجاج ولحم! 🌯🔥 وكمان عندنا وجبات عائلية مميزة! جرب الكومبو الجديد، راح يعجبك 😍"

IMPORTANT RULES:
- Keep responses SHORT (2-4 sentences max) - this is social media!
- Match the customer's energy level
- Use knowledge base information when relevant
- Be authentic and human, not robotic
- Use emojis to add personality
- For complex issues, direct them to phone/email
- Always stay positive and solution-oriented
- Reference specific menu items or policies from knowledge base when applicable

FORMAT YOUR RESPONSE EXACTLY AS:

ARABIC_RESPONSE:
[Short, friendly Arabic response with emojis]

ENGLISH_RESPONSE:
[Short, friendly English response with emojis]`;

      const appId = import.meta.env.VITE_APP_ID;
      const response = await fetch(
        `https://api-integrations.appmedo.com/${appId}/api-DLEOVEz2yxwa/v1beta/models/gemini-1.5-flash:generateContent`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            contents: [
              {
                role: 'user',
                parts: [
                  {
                    text: `${systemPrompt}\n\nCustomer message: ${socialInput}`
                  }
                ]
              }
            ]
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.text();
        console.error('Social Media API Error Response:', errorData);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const fullText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (fullText) {
        const arabicMatch = fullText.match(/ARABIC_RESPONSE:\s*([\s\S]*?)(?=ENGLISH_RESPONSE:|$)/i);
        const englishMatch = fullText.match(/ENGLISH_RESPONSE:\s*([\s\S]*?)$/i);

        if (arabicMatch && englishMatch) {
          setSocialArabicResponse(arabicMatch[1].trim());
          setSocialEnglishResponse(englishMatch[1].trim());
          toast.success('Social media response generated successfully!');
        } else {
          console.error('Failed to parse response. Full text:', fullText);
          toast.error('Failed to parse generated response. Please try again.');
        }
      } else {
        console.error('No text generated from API');
        toast.error('Failed to generate response');
      }
    } catch (error: any) {
      console.error('Error generating social media response:', error);
      const errorMsg = error?.message || 'Failed to generate response';
      toast.error(errorMsg);
    } finally {
      setIsGeneratingSocial(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#4B0F0F] via-[#6A1B2C] to-[#8B2635]">
      {/* Header */}
      <div className="border-b border-white/10 bg-black/20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-3">
              <Sparkles className="h-10 w-10 text-[#F6B600]" />
              <h1 className="text-4xl font-bold text-white">
                AI Assistant Hub
              </h1>
            </div>
            <p className="text-xl text-white/90 font-medium" dir="rtl">
              مركز مساعد الذكاء الاصطناعي لخدمة العملاء 🤖✨
            </p>
            <p className="text-sm text-[#F6B600] font-medium" dir="rtl">
              دايماً تستخدم الذكاء الاصطناعي؟ شكلك ما تبي تفكر بنفسك شوية! 😅 • مخصص فقط لموظفي خدمة العملاء
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue="complaints" className="space-y-6">
          <TabsList className="grid w-full max-w-3xl mx-auto grid-cols-3 bg-white/10 border border-white/20">
            <TabsTrigger 
              value="complaints" 
              className="data-[state=active]:bg-[#F6B600] data-[state=active]:text-black text-white"
            >
              <MessageSquare className="h-4 w-4 mr-2" />
              Complaint Generator
            </TabsTrigger>
            <TabsTrigger 
              value="partoo" 
              className="data-[state=active]:bg-[#F6B600] data-[state=active]:text-black text-white"
            >
              <MapPin className="h-4 w-4 mr-2" />
              Partoo Responses
            </TabsTrigger>
            <TabsTrigger 
              value="social" 
              className="data-[state=active]:bg-[#F6B600] data-[state=active]:text-black text-white"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Social Media
            </TabsTrigger>
          </TabsList>

          {/* Complaint Generator Tab */}
          <TabsContent value="complaints" className="space-y-6">
        {/* Input Section */}
        <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white" dir="rtl">
              <Sparkles className="h-5 w-5 text-[#F6B600]" />
              إدخال الشكوى / Customer Complaint Input 📝
            </CardTitle>
            <CardDescription className="text-white/70" dir="rtl">
              أدخل شكوى العميل بالعربية أو الإنجليزية (خلّي الذكاء الاصطناعي يشتغل بدالك! 😎)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="complaint-input" className="text-white" dir="rtl">
                تفاصيل الشكوى / Complaint Details
              </Label>
              <Textarea
                id="complaint-input"
                placeholder="مثال: العميل يشتكي من أن الطلب وصل متأخر والأكل كان بارد... (اكتب اللي عندك وخلّي الذكاء الاصطناعي يصلحه! 🤖)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                rows={10}
                className="resize-none bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#F6B600] focus:ring-[#F6B600]"
                dir="rtl"
              />
            </div>
            <Button
              onClick={generateComplaint}
              disabled={isGenerating || !inputText.trim()}
              size="lg"
              className="w-full bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
              dir="rtl"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الإنشاء... 🤖
                </>
              ) : (
                <>
                  <Sparkles className="ml-2 h-5 w-5" />
                  إنشاء رد احترافي ✨
                </>
              )}
            </Button>
            <p className="text-xs text-white/60 text-center" dir="rtl">
              أدخل شكوى العميل، وسيقوم الذكاء الاصطناعي بإنشاء نسخة عربية واحترافية ونسخة إنجليزية 📝
            </p>
            <p className="text-xs text-white/60 text-center">
              Enter the customer complaint, and AI will generate professional Arabic and English versions
            </p>
          </CardContent>
        </Card>

        {/* Output Section */}

        {!arabicSubject && !englishSubject && !isGenerating && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center space-y-2">
                <MessageSquare className="h-12 w-12 text-white/30 mx-auto" />
                <p className="text-white/50 font-medium" dir="rtl">الردود المُنشأة ستظهر هنا</p>
                <p className="text-white/30 text-sm">Generated responses will appear here</p>
              </div>
            </CardContent>
          </Card>
        )}

        {isGenerating && (
          <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
            <CardContent className="py-12">
              <div className="text-center space-y-4">
                <Loader2 className="h-12 w-12 text-[#F6B600] mx-auto animate-spin" />
                <p className="text-white font-medium" dir="rtl">جاري إنشاء الرد الاحترافي...</p>
                <p className="text-white/50 text-sm">Generating professional response...</p>
              </div>
            </CardContent>
          </Card>
        )}

        {(arabicSubject || englishSubject) && (
          <div className="grid gap-6 xl:grid-cols-2">
            {/* Arabic Section */}
            <div className="space-y-4">
              {/* Arabic Subject */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white" dir="rtl">
                      <Languages className="h-5 w-5 text-[#F6B600]" />
                      العنوان (Arabic Subject)
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(arabicSubject, 'Arabic Subject')}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      نسخ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[80px]" dir="rtl">
                    <p className="text-white whitespace-pre-wrap leading-relaxed font-arabic text-base">{arabicSubject}</p>
                  </div>
                </CardContent>
              </Card>

              {/* Arabic Description */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white" dir="rtl">
                      <Languages className="h-5 w-5 text-[#F6B600]" />
                      الوصف (Arabic Description)
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(arabicDescription, 'Arabic Description')}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      نسخ
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[150px]" dir="rtl">
                    <p className="text-white whitespace-pre-wrap leading-relaxed font-arabic text-base">{arabicDescription}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* English Section */}
            <div className="space-y-4">
              {/* English Subject */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Languages className="h-5 w-5 text-[#F6B600]" />
                      Subject (English)
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(englishSubject, 'English Subject')}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[80px]">
                    <p className="text-white whitespace-pre-wrap leading-relaxed text-base">{englishSubject}</p>
                  </div>
                </CardContent>
              </Card>

              {/* English Description */}
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <Languages className="h-5 w-5 text-[#F6B600]" />
                      Description (English)
                    </CardTitle>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(englishDescription, 'English Description')}
                      className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="bg-white/5 rounded-lg p-4 border border-white/10 min-h-[150px]">
                    <p className="text-white whitespace-pre-wrap leading-relaxed text-base">{englishDescription}</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
          </TabsContent>

          {/* Partoo Response Generator Tab */}
          <TabsContent value="partoo" className="space-y-6">
            {/* Input Section */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <MapPin className="h-5 w-5 text-[#F6B600]" />
                  Partoo Comment Input / إدخال تعليق جوجل ماب
                </CardTitle>
                <CardDescription className="text-white/70">
                  Enter customer Google Maps review or comment • أدخل تعليق العميل من جوجل ماب
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="partoo-input" className="text-white">
                    Customer Comment / تعليق العميل
                  </Label>
                  <Textarea
                    id="partoo-input"
                    placeholder="مثال: الموظفين محترمين، بس واجهتني مشكلتين..."
                    value={partooInput}
                    onChange={(e) => setPartooInput(e.target.value)}
                    rows={8}
                    className="resize-none bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#F6B600] focus:ring-[#F6B600]"
                  />
                </div>
                <Button
                  onClick={generatePartooResponse}
                  disabled={isGeneratingPartoo || !partooInput.trim()}
                  size="lg"
                  className="w-full bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
                >
                  {isGeneratingPartoo ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري الإنشاء... / Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      إنشاء رد احترافي / Generate Professional Response
                    </>
                  )}
                </Button>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2">
                  <p className="text-xs text-white/80 font-medium">📋 Contact Information (Always Included):</p>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Mail className="h-4 w-4 text-[#F6B600]" />
                    <span>reviews@shawarmer.com</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-white/70">
                    <Phone className="h-4 w-4 text-[#F6B600]" />
                    <span>920008080</span>
                  </div>
                </div>
                <p className="text-xs text-white/60 text-center">
                  💡 The AI will generate creative, professional responses in both Arabic and English with appropriate emojis and contact information.
                </p>
              </CardContent>
            </Card>

            {/* Output Section */}
            {!partooArabicResponse && !partooEnglishResponse && !isGeneratingPartoo && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <MapPin className="h-12 w-12 text-white/30 mx-auto" />
                    <p className="text-white/50 font-medium">Generated responses will appear here</p>
                    <p className="text-white/30 text-sm">Enter a customer comment and click "Generate Professional Response"</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGeneratingPartoo && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-[#F6B600] mx-auto animate-spin" />
                    <p className="text-white font-medium">Generating professional response...</p>
                    <p className="text-white/50 text-sm">Please wait</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(partooArabicResponse || partooEnglishResponse) && (
              <>
                {/* Arabic Response */}
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Languages className="h-5 w-5 text-[#F6B600]" />
                        الرد بالعربية / Arabic Response
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(partooArabicResponse, 'Arabic Response')}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        نسخ / Copy
                      </Button>
                    </div>
                    <CardDescription className="text-white/70">
                      Professional Arabic response for Google Maps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10" dir="rtl">
                      <p className="text-white whitespace-pre-wrap">{partooArabicResponse}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* English Response */}
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Languages className="h-5 w-5 text-[#F6B600]" />
                        English Response
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(partooEnglishResponse, 'English Response')}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        نسخ / Copy
                      </Button>
                    </div>
                    <CardDescription className="text-white/70">
                      Professional English response for Google Maps
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{partooEnglishResponse}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          {/* Social Media Response Generator Tab */}
          <TabsContent value="social" className="space-y-6">
            {/* Knowledge Base Status */}
            {isLoadingKnowledge && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 text-white/70">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Loading knowledge base...</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {!isLoadingKnowledge && (
              <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                <CardContent className="py-4">
                  <div className="flex items-center gap-3 text-white/70">
                    <Lightbulb className="h-4 w-4 text-[#F6B600]" />
                    <span className="text-sm">
                      📚 Knowledge Base Loaded: {knowledgeArticles.filter(a => a.status === 'published').length} articles available
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Input Section */}
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Share2 className="h-5 w-5 text-[#F6B600]" />
                  Social Media Response Generator
                </CardTitle>
                <CardDescription className="text-white/70">
                  Generate engaging responses for Instagram, Twitter, Facebook, TikTok, etc. • AI trained with knowledge base
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="social-input" className="text-white">
                    Customer Message / رسالة العميل
                  </Label>
                  <Textarea
                    id="social-input"
                    placeholder="مثال: متى تفتحون؟ عندكم توصيل؟ / Example: What time do you open? Do you have delivery?"
                    value={socialInput}
                    onChange={(e) => setSocialInput(e.target.value)}
                    rows={6}
                    className="resize-none bg-white/10 border-white/30 text-white placeholder:text-white/50 focus:border-[#F6B600] focus:ring-[#F6B600]"
                  />
                </div>
                <Button
                  onClick={generateSocialMediaResponse}
                  disabled={isGeneratingSocial || !socialInput.trim() || isLoadingKnowledge}
                  size="lg"
                  className="w-full bg-[#F6B600] hover:bg-[#F6B600]/90 text-black font-semibold"
                >
                  {isGeneratingSocial ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      جاري الإنشاء... / Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      إنشاء رد للسوشيال ميديا / Generate Social Media Response
                    </>
                  )}
                </Button>
                <div className="bg-white/5 rounded-lg p-4 border border-white/10 space-y-2">
                  <p className="text-xs text-white/80 font-medium">✨ AI Features:</p>
                  <ul className="text-xs text-white/70 space-y-1 list-disc list-inside">
                    <li>Trained with your knowledge base articles</li>
                    <li>Provides accurate information about menu, hours, policies</li>
                    <li>Generates engaging, emoji-rich responses</li>
                    <li>Matches customer's tone and energy</li>
                  </ul>
                </div>
                <p className="text-xs text-white/60 text-center">
                  💡 The AI uses your knowledge base to provide accurate, helpful responses for social media platforms.
                </p>
              </CardContent>
            </Card>

            {/* Output Section */}
            {!socialArabicResponse && !socialEnglishResponse && !isGeneratingSocial && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-2">
                    <Share2 className="h-12 w-12 text-white/30 mx-auto" />
                    <p className="text-white/50 font-medium">Generated responses will appear here</p>
                    <p className="text-white/30 text-sm">Enter a customer message and click "Generate Social Media Response"</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {isGeneratingSocial && (
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardContent className="py-12">
                  <div className="text-center space-y-4">
                    <Loader2 className="h-12 w-12 text-[#F6B600] mx-auto animate-spin" />
                    <p className="text-white font-medium">Generating social media response...</p>
                    <p className="text-white/50 text-sm">Analyzing knowledge base and crafting response</p>
                  </div>
                </CardContent>
              </Card>
            )}

            {(socialArabicResponse || socialEnglishResponse) && (
              <>
                {/* Arabic Response */}
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Languages className="h-5 w-5 text-[#F6B600]" />
                        الرد بالعربية / Arabic Response
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(socialArabicResponse, 'Arabic Response')}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        نسخ / Copy
                      </Button>
                    </div>
                    <CardDescription className="text-white/70">
                      Engaging Arabic response for social media
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{socialArabicResponse}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* English Response */}
                <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2 text-white">
                        <Languages className="h-5 w-5 text-[#F6B600]" />
                        English Response
                      </CardTitle>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => copyToClipboard(socialEnglishResponse, 'English Response')}
                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        نسخ / Copy
                      </Button>
                    </div>
                    <CardDescription className="text-white/70">
                      Engaging English response for social media
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-white/5 rounded-lg p-4 border border-white/10">
                      <p className="text-white whitespace-pre-wrap">{socialEnglishResponse}</p>
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
