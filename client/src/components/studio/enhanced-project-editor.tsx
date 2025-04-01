import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import { Mic, Headphones, Settings, Play, Square, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

export function EnhancedProjectEditor({ projectId, onBack }: { projectId: number; onBack: () => void; }) {
  const [isRecording, setIsRecording] = useState(false);
  const [volume, setVolume] = useState(75);

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="border-b p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onBack}>Back</Button>
          <h1 className="text-xl font-semibold">Studio</h1>
        </div>
        <Button variant="outline" size="sm">
          <Save className="h-4 w-4 mr-2" />
          Save
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Tracks Panel */}
        <div className="flex-1 p-4 overflow-y-auto border-r">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-medium">Tracks</h2>
              <Button size="sm">
                <Mic className="h-4 w-4 mr-2" />
                Add Track
              </Button>
            </div>

            {/* Track List */}
            <div className="space-y-2">
              {[1, 2, 3, 4, 5, 6, 7, 8].map((track) => ( //Added more tracks for a more realistic example.
                <Card key={track} className="bg-card hover:bg-accent transition-colors">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Mic className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-medium">Vocal Track {track}</p>
                          <p className="text-sm text-muted-foreground">00:00</p>
                        </div>
                      </div>
                      <Slider
                        className="w-24"
                        defaultValue={[75]}
                        max={100}
                        step={1}
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Controls Panel */}
        <div className="w-full md:w-80 p-4 bg-muted/30">
          <Tabs defaultValue="effects" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="effects">Effects</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="effects" className="flex-1">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">AutoPitch</h3>
                    <Slider defaultValue={[50]} max={100} step={1} />
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-medium">Reverb</h3>
                    <Slider defaultValue={[30]} max={100} step={1} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="settings">
              <Card>
                <CardContent className="p-4 space-y-4">
                  <div className="space-y-2">
                    <h3 className="font-medium">Input Volume</h3>
                    <Slider defaultValue={[volume]} max={100} step={1} onChange={(e) => setVolume(e.target.value as number)}/> {/*Added onChange handler*/}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="border-t p-4">
        <div className="flex items-center justify-center gap-4">
          <Button
            size="lg"
            variant={isRecording ? "destructive" : "default"}
            onClick={() => setIsRecording(!isRecording)}
          >
            {isRecording ? (
              <Square className="h-4 w-4 mr-2" />
            ) : (
              <Mic className="h-4 w-4 mr-2" />
            )}
            {isRecording ? "Stop" : "Record"}
          </Button>

          <Button size="lg" variant="outline">
            <Play className="h-4 w-4 mr-2" />
            Play
          </Button>
        </div>
      </div>
    </div>
  );
}