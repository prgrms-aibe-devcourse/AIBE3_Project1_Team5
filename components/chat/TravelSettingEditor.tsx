import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Calendar, 
  Users, 
  DollarSign, 
  Car, 
  Home, 
  Heart,
  Check,
  X
} from 'lucide-react';

interface TravelSettings {
  duration: number;
  peopleCount: number;
  budget: number;
  travelStyle: string;
  transportation: string;
  accommodation: string;
}

interface TravelSettingEditorProps {
  currentSettings: TravelSettings;
  onSave: (settings: Partial<TravelSettings>) => void;
  onCancel: () => void;
}

export default function TravelSettingEditor({ 
  currentSettings, 
  onSave, 
  onCancel 
}: TravelSettingEditorProps) {
  const [editedSettings, setEditedSettings] = useState<Partial<TravelSettings>>({});
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set());

  const toggleField = (field: string) => {
    const newEditingFields = new Set(editingFields);
    if (newEditingFields.has(field)) {
      newEditingFields.delete(field);
      const newSettings = { ...editedSettings };
      delete newSettings[field as keyof TravelSettings];
      setEditedSettings(newSettings);
    } else {
      newEditingFields.add(field);
    }
    setEditingFields(newEditingFields);
  };

  const handleSave = () => {
    if (Object.keys(editedSettings).length > 0) {
      onSave(editedSettings);
    }
  };

  const travelStyles = ['휴식중심', '관광위주', '액티비티', '문화체험', '맛집탐방', '쇼핑중심'];
  const transportOptions = ['대중교통', '렌터카', '도보', '자전거', '택시'];
  const accommodationOptions = ['호텔', '리조트', '펜션', '게스트하우스', '에어비앤비', '호스텔'];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-lg">여행 설정 수정</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* 기간 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">여행 기간</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.duration}일</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('duration') ? (
              <>
                <Input
                  type="number"
                  min="1"
                  max="30"
                  defaultValue={currentSettings.duration}
                  onChange={(e) => setEditedSettings({...editedSettings, duration: parseInt(e.target.value)})}
                  className="w-20"
                />
                <span className="text-sm">일</span>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('duration')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 인원 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">여행 인원</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.peopleCount}명</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('peopleCount') ? (
              <>
                <Input
                  type="number"
                  min="1"
                  max="20"
                  defaultValue={currentSettings.peopleCount}
                  onChange={(e) => setEditedSettings({...editedSettings, peopleCount: parseInt(e.target.value)})}
                  className="w-20"
                />
                <span className="text-sm">명</span>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('peopleCount')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 예산 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <DollarSign className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">예산</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.budget.toLocaleString()}원</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('budget') ? (
              <>
                <Input
                  type="number"
                  min="10000"
                  step="10000"
                  defaultValue={currentSettings.budget}
                  onChange={(e) => setEditedSettings({...editedSettings, budget: parseInt(e.target.value)})}
                  className="w-32"
                />
                <span className="text-sm">원</span>
              </>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('budget')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 여행 스타일 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Heart className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">여행 스타일</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.travelStyle}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('travelStyle') ? (
              <select
                defaultValue={currentSettings.travelStyle}
                onChange={(e) => setEditedSettings({...editedSettings, travelStyle: e.target.value})}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {travelStyles.map(style => (
                  <option key={style} value={style}>{style}</option>
                ))}
              </select>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('travelStyle')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 교통수단 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Car className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">교통수단</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.transportation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('transportation') ? (
              <select
                defaultValue={currentSettings.transportation}
                onChange={(e) => setEditedSettings({...editedSettings, transportation: e.target.value})}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {transportOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('transportation')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 숙박 */}
        <div className="flex items-center justify-between p-3 border rounded-lg">
          <div className="flex items-center gap-3">
            <Home className="h-5 w-5 text-gray-500" />
            <div>
              <Label className="text-sm font-medium">숙박</Label>
              <p className="text-sm text-gray-500">현재: {currentSettings.accommodation}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {editingFields.has('accommodation') ? (
              <select
                defaultValue={currentSettings.accommodation}
                onChange={(e) => setEditedSettings({...editedSettings, accommodation: e.target.value})}
                className="px-3 py-1 border rounded-md text-sm"
              >
                {accommodationOptions.map(option => (
                  <option key={option} value={option}>{option}</option>
                ))}
              </select>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => toggleField('accommodation')}
              >
                수정
              </Button>
            )}
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={Object.keys(editedSettings).length === 0}
            className="flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            변경사항 적용
          </Button>
          <Button
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            <X className="h-4 w-4 mr-2" />
            취소
          </Button>
        </div>

        {Object.keys(editedSettings).length > 0 && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>변경될 항목:</strong> {Object.keys(editedSettings).join(', ')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}