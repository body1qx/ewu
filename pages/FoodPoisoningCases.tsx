import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/AuthProvider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { FileText, Download, Loader2, ClipboardList, Activity, History, Utensils, Users, FlaskConical } from 'lucide-react';
import { createFoodPoisoningCase, updateCasePdfLanguages } from '@/db/api';
import { generateEnglishPDF } from '@/utils/generateEnglishPDF';
import { generateArabicPDF } from '@/utils/generateArabicPDF';
import type { FoodPoisoningCase, FoodPoisoningOutcome } from '@/types/types';
import { useTranslation } from 'react-i18next';

export default function FoodPoisoningCases() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [caseNumber, setCaseNumber] = useState('');
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Form state
  const [formData, setFormData] = useState({
    // General Information
    customer_name: '',
    contact_number: '',
    age: '',
    store_location: '',
    order_date: '',
    complaint_date: '',
    
    // Signs and Symptoms
    symptom_diarrhea: false,
    symptom_vomiting: false,
    symptom_abdominal_cramps: false,
    symptom_fever: false,
    symptom_nausea: false,
    symptom_malaise: false,
    symptom_headache: false,
    symptom_body_ache: false,
    symptom_other: '',
    
    // History of Illness
    illness_onset_date: '',
    illness_onset_time: '',
    illness_duration_days: '',
    hospitalization: false,
    hospitalization_date: '',
    travel_history: '',
    outcome: '' as FoodPoisoningOutcome | '',
    outcome_complications: '',
    
    // Food History
    last_meal_details: '',
    previous_meal_details: '',
    
    // Contacts/Family & Order Details
    sick_contacts: '',
    order_details: '',
    
    // Lab Investigation & Completion
    lab_stool: false,
    lab_rectal_swab: false,
    lab_rectal_swab_datetime: '',
    form_completed_by: '',
    form_completion_date: '',
    comments: '',
  });
  
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);
  
  useEffect(() => {
    // Generate case number on mount
    const year = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 9999) + 1;
    setCaseNumber(`FP-${year}-${String(randomNum).padStart(4, '0')}`);
  }, []);
  
  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };
  
  const validateForm = (): boolean => {
    if (!formData.customer_name.trim()) {
      toast.error('Please enter customer name');
      return false;
    }
    return true;
  };
  
  const handleGeneratePDF = async (language: 'english' | 'arabic') => {
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      // Prepare case data
      const caseData: Omit<FoodPoisoningCase, 'id' | 'case_number' | 'created_at' | 'updated_at' | 'pdf_generated_languages'> = {
        created_by: user?.id || null,
        customer_name: formData.customer_name,
        contact_number: formData.contact_number || null,
        age: formData.age ? parseInt(formData.age) : null,
        store_location: formData.store_location || null,
        order_date: formData.order_date || null,
        complaint_date: formData.complaint_date || null,
        symptom_diarrhea: formData.symptom_diarrhea,
        symptom_vomiting: formData.symptom_vomiting,
        symptom_abdominal_cramps: formData.symptom_abdominal_cramps,
        symptom_fever: formData.symptom_fever,
        symptom_nausea: formData.symptom_nausea,
        symptom_malaise: formData.symptom_malaise,
        symptom_headache: formData.symptom_headache,
        symptom_body_ache: formData.symptom_body_ache,
        symptom_other: formData.symptom_other || null,
        illness_onset_date: formData.illness_onset_date || null,
        illness_onset_time: formData.illness_onset_time || null,
        illness_duration_days: formData.illness_duration_days ? parseInt(formData.illness_duration_days) : null,
        hospitalization: formData.hospitalization,
        hospitalization_date: formData.hospitalization_date || null,
        travel_history: formData.travel_history || null,
        outcome: formData.outcome || null,
        outcome_complications: formData.outcome_complications || null,
        last_meal_details: formData.last_meal_details || null,
        previous_meal_details: formData.previous_meal_details || null,
        sick_contacts: formData.sick_contacts || null,
        order_details: formData.order_details || null,
        lab_stool: formData.lab_stool,
        lab_rectal_swab: formData.lab_rectal_swab,
        lab_rectal_swab_datetime: formData.lab_rectal_swab_datetime || null,
        form_completed_by: formData.form_completed_by || null,
        form_completion_date: formData.form_completion_date || null,
        comments: formData.comments || null,
      };
      
      // Save to database
      const savedCase = await createFoodPoisoningCase(caseData);
      
      // Generate PDF
      if (language === 'english') {
        generateEnglishPDF(savedCase);
      } else {
        await generateArabicPDF(savedCase);
      }
      
      // Update PDF language tracking
      await updateCasePdfLanguages(savedCase.id, language);
      
      toast.success(`PDF generated successfully in ${language === 'english' ? 'English' : 'Arabic'} – check your downloads`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const parallaxX = (mousePosition.x - window.innerWidth / 2) / 50;
  const parallaxY = (mousePosition.y - window.innerHeight / 2) / 50;
  
  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-[#4a1a1a] via-[#6b2424] to-[#8b3a1a]">
      {/* Animated background elements */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          transform: `translate(${parallaxX}px, ${parallaxY}px)`,
          transition: 'transform 0.3s ease-out',
        }}
      >
        <div className="absolute top-20 left-20 w-64 h-64 bg-orange-500/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-amber-500/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-red-500/10 rounded-full blur-3xl" />
      </div>
      
      {/* Main content */}
      <div className="relative z-10 container mx-auto px-4 py-8">
        {/* Glassmorphism card */}
        <div className="max-w-6xl mx-auto bg-white/10 backdrop-blur-xl rounded-2xl border border-white/20 shadow-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <FileText className="w-10 h-10 text-orange-400" />
              <h1 className="text-4xl font-bold text-white">
                Food Poisoning Case Investigation
              </h1>
            </div>
            <p className="text-xl text-white/80 mb-2">
              تحقيق في حالة تسمم غذائي
            </p>
            <p className="text-white/70">
              Fill the case details and generate a professional PDF report (Arabic or English)
            </p>
            <div className="mt-4 inline-block bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/30">
              <span className="text-white font-semibold">Case ID: {caseNumber}</span>
            </div>
          </div>
          
          {/* Form sections */}
          <div className="space-y-8">
            {/* General Information */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <ClipboardList className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">General Information / المعلومات العامة</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer_name" className="text-white">Customer Name / اسم العميل *</Label>
                  <Input
                    id="customer_name"
                    value={formData.customer_name}
                    onChange={(e) => handleInputChange('customer_name', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="contact_number" className="text-white">Contact Number / رقم التواصل</Label>
                  <Input
                    id="contact_number"
                    value={formData.contact_number}
                    onChange={(e) => handleInputChange('contact_number', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter contact number"
                  />
                </div>
                <div>
                  <Label htmlFor="age" className="text-white">Age / العمر</Label>
                  <Input
                    id="age"
                    type="number"
                    value={formData.age}
                    onChange={(e) => handleInputChange('age', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter age"
                  />
                </div>
                <div>
                  <Label htmlFor="store_location" className="text-white">Store Location / موقع الفرع</Label>
                  <Input
                    id="store_location"
                    value={formData.store_location}
                    onChange={(e) => handleInputChange('store_location', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Enter store location"
                  />
                </div>
                <div>
                  <Label htmlFor="order_date" className="text-white">Order Date / تاريخ الطلب</Label>
                  <Input
                    id="order_date"
                    type="date"
                    value={formData.order_date}
                    onChange={(e) => handleInputChange('order_date', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="complaint_date" className="text-white">Complaint Date / تاريخ الشكوى</Label>
                  <Input
                    id="complaint_date"
                    type="date"
                    value={formData.complaint_date}
                    onChange={(e) => handleInputChange('complaint_date', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
              </div>
            </section>
            
            {/* Signs and Symptoms */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Activity className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Signs and Symptoms / العلامات والأعراض</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { id: 'symptom_diarrhea', label: 'Diarrhea / إسهال' },
                  { id: 'symptom_vomiting', label: 'Vomiting / قيء' },
                  { id: 'symptom_abdominal_cramps', label: 'Abdominal Cramps / تقلصات في البطن' },
                  { id: 'symptom_fever', label: 'Fever / حمى' },
                  { id: 'symptom_nausea', label: 'Nausea / غثيان' },
                  { id: 'symptom_malaise', label: 'Malaise / شعور عام بالإرهاق' },
                  { id: 'symptom_headache', label: 'Headache / صداع' },
                  { id: 'symptom_body_ache', label: 'Body-ache / آلام في الجسم' },
                ].map((symptom) => (
                  <div key={symptom.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={symptom.id}
                      checked={formData[symptom.id as keyof typeof formData] as boolean}
                      onCheckedChange={(checked) => handleInputChange(symptom.id, checked)}
                      className="border-white/30 data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor={symptom.id} className="text-white cursor-pointer">
                      {symptom.label}
                    </Label>
                  </div>
                ))}
              </div>
              <div className="mt-4">
                <Label htmlFor="symptom_other" className="text-white">Other Symptoms / أعراض أخرى</Label>
                <Input
                  id="symptom_other"
                  value={formData.symptom_other}
                  onChange={(e) => handleInputChange('symptom_other', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                  placeholder="Describe other symptoms"
                />
              </div>
            </section>
            
            {/* History of Illness */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <History className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">History of Illness / تاريخ المرض</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="illness_onset_date" className="text-white">Date of Onset / تاريخ بداية المرض</Label>
                  <Input
                    id="illness_onset_date"
                    type="date"
                    value={formData.illness_onset_date}
                    onChange={(e) => handleInputChange('illness_onset_date', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="illness_onset_time" className="text-white">Time of Onset / الوقت</Label>
                  <Input
                    id="illness_onset_time"
                    type="time"
                    value={formData.illness_onset_time}
                    onChange={(e) => handleInputChange('illness_onset_time', e.target.value)}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="illness_duration_days" className="text-white">Duration (days) / المدة (عدد الأيام)</Label>
                  <Input
                    id="illness_duration_days"
                    type="number"
                    value={formData.illness_duration_days}
                    onChange={(e) => handleInputChange('illness_duration_days', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                    placeholder="Number of days"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Checkbox
                    id="hospitalization"
                    checked={formData.hospitalization}
                    onCheckedChange={(checked) => handleInputChange('hospitalization', checked)}
                    className="border-white/30 data-[state=checked]:bg-orange-500"
                  />
                  <Label htmlFor="hospitalization" className="text-white cursor-pointer">
                    Hospitalization / التنويم في المستشفى
                  </Label>
                </div>
                {formData.hospitalization && (
                  <div>
                    <Label htmlFor="hospitalization_date" className="text-white">Hospitalization Date / تاريخ التنويم</Label>
                    <Input
                      id="hospitalization_date"
                      type="date"
                      value={formData.hospitalization_date}
                      onChange={(e) => handleInputChange('hospitalization_date', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4">
                <Label htmlFor="travel_history" className="text-white">
                  Travel History (past 2-3 days) / تاريخ السفر (آخر 2-3 أيام)
                </Label>
                <Textarea
                  id="travel_history"
                  value={formData.travel_history}
                  onChange={(e) => handleInputChange('travel_history', e.target.value)}
                  className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                  placeholder="Specify where and when"
                />
              </div>
              <div className="mt-4">
                <Label className="text-white mb-3 block">Outcome / النتيجة</Label>
                <RadioGroup
                  value={formData.outcome}
                  onValueChange={(value) => handleInputChange('outcome', value)}
                  className="space-y-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="recovered" id="recovered" className="border-white/30 text-orange-500" />
                    <Label htmlFor="recovered" className="text-white cursor-pointer">Recovered / التعافي</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="on_treatment" id="on_treatment" className="border-white/30 text-orange-500" />
                    <Label htmlFor="on_treatment" className="text-white cursor-pointer">On Treatment / يتلقى العلاج</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="more_complications" id="more_complications" className="border-white/30 text-orange-500" />
                    <Label htmlFor="more_complications" className="text-white cursor-pointer">More Complications / مضاعفات إضافية</Label>
                  </div>
                </RadioGroup>
                {formData.outcome === 'more_complications' && (
                  <div className="mt-3">
                    <Label htmlFor="outcome_complications" className="text-white">Describe Complications / وصف المضاعفات</Label>
                    <Textarea
                      id="outcome_complications"
                      value={formData.outcome_complications}
                      onChange={(e) => handleInputChange('outcome_complications', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Describe the complications"
                    />
                  </div>
                )}
              </div>
            </section>
            
            {/* Food History */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Utensils className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Food History / تاريخ تناول الطعام</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="last_meal_details" className="text-white">
                    Last Meal Details / تفاصيل الوجبة الأخيرة
                  </Label>
                  <Textarea
                    id="last_meal_details"
                    value={formData.last_meal_details}
                    onChange={(e) => handleInputChange('last_meal_details', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                    placeholder="Place and list the foods taken in the last meal. Time of consumption and where it was taken. Underline the suspected food taken."
                  />
                </div>
                <div>
                  <Label htmlFor="previous_meal_details" className="text-white">
                    Previous Meal Details / تفاصيل الوجبة السابقة
                  </Label>
                  <Textarea
                    id="previous_meal_details"
                    value={formData.previous_meal_details}
                    onChange={(e) => handleInputChange('previous_meal_details', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                    placeholder="Place and list the foods taken in the meal previous to the last meal. Time of consumption and where it was taken."
                  />
                </div>
              </div>
            </section>
            
            {/* Contacts/Family & Order Details */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Contacts / Family & Order / العائلة والأصدقاء وتفاصيل الطلب</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="sick_contacts" className="text-white">
                    Friends/Family Members Who Are Sick / الأصدقاء أو أفراد العائلة المرضى
                  </Label>
                  <Textarea
                    id="sick_contacts"
                    value={formData.sick_contacts}
                    onChange={(e) => handleInputChange('sick_contacts', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                    placeholder="List the members and specify the sickness"
                  />
                </div>
                <div>
                  <Label htmlFor="order_details" className="text-white">
                    Order Details / تفاصيل الطلب
                  </Label>
                  <Textarea
                    id="order_details"
                    value={formData.order_details}
                    onChange={(e) => handleInputChange('order_details', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[80px]"
                    placeholder="Was it an individual order or from more than one person? Specify the ordered items and if someone else had the same symptoms."
                  />
                </div>
              </div>
            </section>
            
            {/* Lab Investigation & Completion */}
            <section className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <div className="flex items-center gap-2 mb-4">
                <FlaskConical className="w-5 h-5 text-orange-400" />
                <h2 className="text-2xl font-bold text-white">Lab Investigation & Completion / التحقيق المخبري والإكمال</h2>
              </div>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-6">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lab_stool"
                      checked={formData.lab_stool}
                      onCheckedChange={(checked) => handleInputChange('lab_stool', checked)}
                      className="border-white/30 data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor="lab_stool" className="text-white cursor-pointer">
                      Stool Investigation / عينة براز
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="lab_rectal_swab"
                      checked={formData.lab_rectal_swab}
                      onCheckedChange={(checked) => handleInputChange('lab_rectal_swab', checked)}
                      className="border-white/30 data-[state=checked]:bg-orange-500"
                    />
                    <Label htmlFor="lab_rectal_swab" className="text-white cursor-pointer">
                      Rectal Swab Taken / مسحة مستقيمية
                    </Label>
                  </div>
                </div>
                {formData.lab_rectal_swab && (
                  <div>
                    <Label htmlFor="lab_rectal_swab_datetime" className="text-white">
                      Rectal Swab Date & Time / تاريخ ووقت المسحة
                    </Label>
                    <Input
                      id="lab_rectal_swab_datetime"
                      type="datetime-local"
                      value={formData.lab_rectal_swab_datetime}
                      onChange={(e) => handleInputChange('lab_rectal_swab_datetime', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="form_completed_by" className="text-white">Form Completed By / تم إكمال النموذج بواسطة</Label>
                    <Input
                      id="form_completed_by"
                      value={formData.form_completed_by}
                      onChange={(e) => handleInputChange('form_completed_by', e.target.value)}
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
                      placeholder="Enter name"
                    />
                  </div>
                  <div>
                    <Label htmlFor="form_completion_date" className="text-white">Form Completion Date / تاريخ إكمال النموذج</Label>
                    <Input
                      id="form_completion_date"
                      type="date"
                      value={formData.form_completion_date}
                      onChange={(e) => handleInputChange('form_completion_date', e.target.value)}
                      className="bg-white/10 border-white/20 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="comments" className="text-white">Comments / الملاحظات</Label>
                  <Textarea
                    id="comments"
                    value={formData.comments}
                    onChange={(e) => handleInputChange('comments', e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/50 min-h-[100px]"
                    placeholder="Additional comments or notes"
                  />
                </div>
              </div>
            </section>
          </div>
          
          {/* Action buttons */}
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button
              onClick={() => handleGeneratePDF('english')}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              Generate PDF (English)
            </Button>
            <Button
              onClick={() => handleGeneratePDF('arabic')}
              disabled={isSubmitting}
              className="bg-gradient-to-r from-amber-600 to-orange-500 hover:from-amber-700 hover:to-orange-600 text-white font-semibold px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
            >
              {isSubmitting ? (
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
              ) : (
                <Download className="w-5 h-5 mr-2" />
              )}
              Generate PDF (Arabic)
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
