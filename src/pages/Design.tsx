import { useState } from 'react'
// Toast
import { Toaster } from '@/components/ui/sonner'
import { toast } from 'sonner'

// Base
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Slider } from '@/components/ui/slider'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Toggle } from '@/components/ui/toggle'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// Layout / Display
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { ScrollArea } from '@/components/ui/scroll-area'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable'

// Navigation
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { NavigationMenu, NavigationMenuContent, NavigationMenuItem, NavigationMenuLink, NavigationMenuList, NavigationMenuTrigger } from '@/components/ui/navigation-menu'

// Overlays / Dialogs
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Drawer, DrawerContent, DrawerDescription, DrawerFooter, DrawerHeader, DrawerTitle, DrawerTrigger } from '@/components/ui/drawer'

// Dropdowns & Menus
import { DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuShortcut, ContextMenuTrigger } from '@/components/ui/context-menu'
import { Menubar, MenubarContent, MenubarItem, MenubarMenu, MenubarSeparator, MenubarShortcut, MenubarTrigger } from '@/components/ui/menubar'

// Floating
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'

// Disclosure
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

// Select
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

// Command
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList, CommandSeparator } from '@/components/ui/command'

// Input variants
import { InputGroup, InputGroupAddon, InputGroupInput, InputGroupText } from '@/components/ui/input-group'
import { InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot } from '@/components/ui/input-otp'

// Table
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

// Carousel
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel'

// Calendar
import { Calendar } from '@/components/ui/calendar'

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-14">
      <div className="rh-intertitle mb-5">{title}</div>
      <div className="flex flex-wrap gap-4 items-start">{children}</div>
    </section>
  )
}

export default function Design() {
  const [sliderVal, setSliderVal] = useState(40)
  const [progress] = useState(65)
  const [checked, setChecked] = useState(false)
  const [switchOn, setSwitchOn] = useState(false)
  const [calDate, setCalDate] = useState<Date | undefined>(new Date())
  const [collapsibleOpen, setCollapsibleOpen] = useState(false)

  return (
    <TooltipProvider>
      <Toaster />

      <div className="min-h-screen bg-background p-10">
        <div className="max-w-5xl mx-auto">
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Design System</h1>
            <p className="text-muted-foreground text-lg font-medium">Every component — rubber hose style. Built for PKO XP Gaming.</p>
          </div>

          {/* ── BUTTONS ─────────────────────────────────────────── */}
          <Section title="Button">
            <Button>Default</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button disabled>Disabled</Button>
          </Section>

          {/* ── BADGE ───────────────────────────────────────────── */}
          <Section title="Badge">
            <Badge>Default</Badge>
            <Badge variant="secondary">Secondary</Badge>
            <Badge variant="outline">Outline</Badge>
            <Badge variant="destructive">Destructive</Badge>
          </Section>

          {/* ── AVATAR ──────────────────────────────────────────── */}
          <Section title="Avatar">
            <Avatar>
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>CN</AvatarFallback>
            </Avatar>
            <Avatar><AvatarFallback>AB</AvatarFallback></Avatar>
            <Avatar><AvatarFallback>XY</AvatarFallback></Avatar>
          </Section>

          {/* ── SKELETON ────────────────────────────────────────── */}
          <Section title="Skeleton">
            <div className="flex flex-col gap-2">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-56" />
            </div>
            <div className="flex items-center gap-3">
              <Skeleton className="size-10 rounded-full" />
              <div className="flex flex-col gap-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
              </div>
            </div>
          </Section>

          {/* ── INPUT ───────────────────────────────────────────── */}
          <Section title="Input">
            <div className="flex flex-col gap-2 w-56">
              <Label htmlFor="email">Email</Label>
              <Input id="email" type="email" placeholder="you@example.com" />
            </div>
            <div className="flex flex-col gap-2 w-56">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" placeholder="••••••••" />
            </div>
            <div className="flex flex-col gap-2 w-56">
              <Label htmlFor="msg">Textarea</Label>
              <Textarea id="msg" placeholder="Type something..." />
            </div>
            <div className="flex flex-col gap-2 w-56">
              <Label>Select</Label>
              <Select>
                <SelectTrigger><SelectValue placeholder="Pick one" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="a">Option A</SelectItem>
                  <SelectItem value="b">Option B</SelectItem>
                  <SelectItem value="c">Option C</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Section>

          {/* ── INPUT GROUP ─────────────────────────────────────── */}
          <Section title="Input Group">
            <InputGroup className="w-64">
              <InputGroupAddon><InputGroupText>https://</InputGroupText></InputGroupAddon>
              <InputGroupInput placeholder="example.com" />
            </InputGroup>
            <InputGroup className="w-64">
              <InputGroupInput placeholder="Amount" type="number" />
              <InputGroupAddon><InputGroupText>PLN</InputGroupText></InputGroupAddon>
            </InputGroup>
          </Section>

          {/* ── INPUT OTP ───────────────────────────────────────── */}
          <Section title="Input OTP">
            <InputOTP maxLength={6}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
          </Section>

          {/* ── TOGGLES ─────────────────────────────────────────── */}
          <Section title="Checkbox / Radio / Switch">
            <div className="flex items-center gap-2">
              <Checkbox id="ch1" checked={checked} onCheckedChange={(v) => setChecked(!!v)} />
              <Label htmlFor="ch1">Checkbox</Label>
            </div>
            <RadioGroup defaultValue="r1" className="flex gap-4">
              <div className="flex items-center gap-2">
                <RadioGroupItem value="r1" id="r1" /><Label htmlFor="r1">Option 1</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="r2" id="r2" /><Label htmlFor="r2">Option 2</Label>
              </div>
            </RadioGroup>
            <div className="flex items-center gap-2">
              <Switch id="sw" checked={switchOn} onCheckedChange={setSwitchOn} />
              <Label htmlFor="sw">{switchOn ? 'On' : 'Off'}</Label>
            </div>
          </Section>

          {/* ── TOGGLE / TOGGLE GROUP ───────────────────────────── */}
          <Section title="Toggle & Toggle Group">
            <Toggle>Bold</Toggle>
            <Toggle variant="outline">Italic</Toggle>
            <ToggleGroup>
              <ToggleGroupItem value="b">B</ToggleGroupItem>
              <ToggleGroupItem value="i">I</ToggleGroupItem>
              <ToggleGroupItem value="u">U</ToggleGroupItem>
            </ToggleGroup>
            <ToggleGroup variant="outline">
              <ToggleGroupItem value="left">Left</ToggleGroupItem>
              <ToggleGroupItem value="center">Center</ToggleGroupItem>
              <ToggleGroupItem value="right">Right</ToggleGroupItem>
            </ToggleGroup>
          </Section>

          {/* ── SLIDER & PROGRESS ───────────────────────────────── */}
          <Section title="Slider & Progress">
            <div className="w-64 flex flex-col gap-2">
              <Label>Slider: {sliderVal}</Label>
              <Slider
                defaultValue={[sliderVal]}
                max={100}
                step={1}
                onValueChange={(v) => setSliderVal(Array.isArray(v) ? (v as number[])[0] : (v as number))}
              />
            </div>
            <div className="w-64 flex flex-col gap-2">
              <Label>Progress: {progress}%</Label>
              <Progress value={progress} />
            </div>
          </Section>

          {/* ── SEPARATOR ───────────────────────────────────────── */}
          <Section title="Separator">
            <div className="w-64">
              <p className="text-sm">Above</p>
              <Separator className="my-2" />
              <p className="text-sm">Below</p>
            </div>
            <div className="flex h-8 items-center gap-2">
              <span className="text-sm">Left</span>
              <Separator orientation="vertical" />
              <span className="text-sm">Right</span>
            </div>
          </Section>

          {/* ── CARD ────────────────────────────────────────────── */}
          <Section title="Card">
            <Card className="w-72">
              <CardHeader>
                <CardTitle>Card Title</CardTitle>
                <CardDescription>Some description here.</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Card body content goes here.</p>
              </CardContent>
              <CardFooter className="flex justify-between">
                <Button variant="outline" size="sm">Cancel</Button>
                <Button size="sm">Save</Button>
              </CardFooter>
            </Card>
            <Card className="w-72">
              <CardHeader><CardTitle>XP Stats</CardTitle></CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Level</span>
                  <Badge>12</Badge>
                </div>
                <Progress value={72} />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">XP</span>
                  <span>720 / 1000</span>
                </div>
              </CardContent>
            </Card>
          </Section>

          {/* ── ALERT ───────────────────────────────────────────── */}
          <Section title="Alert">
            <Alert className="w-96">
              <AlertTitle>Heads up!</AlertTitle>
              <AlertDescription>This is a default alert with some description text.</AlertDescription>
            </Alert>
            <Alert variant="destructive" className="w-96">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>Something went wrong. Please try again.</AlertDescription>
            </Alert>
          </Section>

          {/* ── TABLE ───────────────────────────────────────────── */}
          <Section title="Table">
            <Table className="w-full max-w-lg">
              <TableCaption>Sample data table</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>XP</TableHead>
                  <TableHead className="text-right">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[['Alice', 12, 720], ['Bob', 7, 340], ['Carol', 21, 1900]].map(([name, level, xp]) => (
                  <TableRow key={name as string}>
                    <TableCell className="font-medium">{name}</TableCell>
                    <TableCell>{level}</TableCell>
                    <TableCell>{xp}</TableCell>
                    <TableCell className="text-right"><Badge variant="secondary">Active</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Section>

          {/* ── SCROLL AREA ─────────────────────────────────────── */}
          <Section title="Scroll Area">
            <ScrollArea className="h-40 w-64 rounded-md border p-3">
              {Array.from({ length: 20 }, (_, i) => (
                <p key={i} className="text-sm py-1 border-b last:border-0">Item {i + 1}</p>
              ))}
            </ScrollArea>
          </Section>

          {/* ── RESIZABLE ───────────────────────────────────────── */}
          <Section title="Resizable">
            <ResizablePanelGroup orientation="horizontal" className="w-96 h-32 rounded-lg border">
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Left</div>
              </ResizablePanel>
              <ResizableHandle />
              <ResizablePanel defaultSize={50}>
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Right</div>
              </ResizablePanel>
            </ResizablePanelGroup>
          </Section>

          {/* ── TABS ────────────────────────────────────────────── */}
          <Section title="Tabs">
            <Tabs defaultValue="tab1" className="w-96">
              <TabsList>
                <TabsTrigger value="tab1">Overview</TabsTrigger>
                <TabsTrigger value="tab2">Analytics</TabsTrigger>
                <TabsTrigger value="tab3">Settings</TabsTrigger>
              </TabsList>
              <TabsContent value="tab1"><Card><CardContent className="pt-4 text-sm text-muted-foreground">Overview content.</CardContent></Card></TabsContent>
              <TabsContent value="tab2"><Card><CardContent className="pt-4 text-sm text-muted-foreground">Analytics content.</CardContent></Card></TabsContent>
              <TabsContent value="tab3"><Card><CardContent className="pt-4 text-sm text-muted-foreground">Settings content.</CardContent></Card></TabsContent>
            </Tabs>
          </Section>

          {/* ── ACCORDION ───────────────────────────────────────── */}
          <Section title="Accordion">
            <Accordion className="w-96">
              <AccordionItem value="i1">
                <AccordionTrigger>What is this?</AccordionTrigger>
                <AccordionContent>This is an accordion item. It can hold any content.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="i2">
                <AccordionTrigger>How does it work?</AccordionTrigger>
                <AccordionContent>Click the trigger to expand or collapse the content.</AccordionContent>
              </AccordionItem>
              <AccordionItem value="i3">
                <AccordionTrigger>Can I nest things?</AccordionTrigger>
                <AccordionContent>Yes, you can nest any React components inside.</AccordionContent>
              </AccordionItem>
            </Accordion>
          </Section>

          {/* ── COLLAPSIBLE ─────────────────────────────────────── */}
          <Section title="Collapsible">
            <Collapsible open={collapsibleOpen} onOpenChange={setCollapsibleOpen} className="w-72">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Repositories</p>
                <CollapsibleTrigger>
                  <Button variant="ghost" size="sm">{collapsibleOpen ? 'Hide' : 'Show'}</Button>
                </CollapsibleTrigger>
              </div>
              <div className="rounded-md border px-3 py-2 text-sm mt-2">@radix-ui/primitives</div>
              <CollapsibleContent className="flex flex-col gap-2 mt-2">
                <div className="rounded-md border px-3 py-2 text-sm">@radix-ui/colors</div>
                <div className="rounded-md border px-3 py-2 text-sm">@stitches/react</div>
              </CollapsibleContent>
            </Collapsible>
          </Section>

          {/* ── COMMAND ─────────────────────────────────────────── */}
          <Section title="Command">
            <Command className="rounded-lg border shadow-md w-72">
              <CommandInput placeholder="Search..." />
              <CommandList>
                <CommandEmpty>No results found.</CommandEmpty>
                <CommandGroup heading="Suggestions">
                  <CommandItem>Calendar</CommandItem>
                  <CommandItem>Search</CommandItem>
                  <CommandItem>Settings</CommandItem>
                </CommandGroup>
                <CommandSeparator />
                <CommandGroup heading="Settings">
                  <CommandItem>Profile</CommandItem>
                  <CommandItem>Billing</CommandItem>
                </CommandGroup>
              </CommandList>
            </Command>
          </Section>

          {/* ── BREADCRUMB ──────────────────────────────────────── */}
          <Section title="Breadcrumb">
            <Breadcrumb>
              <BreadcrumbList>
                <BreadcrumbItem><BreadcrumbLink href="#">Home</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbLink href="#">Dashboard</BreadcrumbLink></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Settings</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
          </Section>

          {/* ── PAGINATION ──────────────────────────────────────── */}
          <Section title="Pagination">
            <Pagination>
              <PaginationContent>
                <PaginationItem><PaginationPrevious href="#" /></PaginationItem>
                <PaginationItem><PaginationLink href="#">1</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#" isActive>2</PaginationLink></PaginationItem>
                <PaginationItem><PaginationLink href="#">3</PaginationLink></PaginationItem>
                <PaginationItem><PaginationEllipsis /></PaginationItem>
                <PaginationItem><PaginationNext href="#" /></PaginationItem>
              </PaginationContent>
            </Pagination>
          </Section>

          {/* ── NAVIGATION MENU ─────────────────────────────────── */}
          <Section title="Navigation Menu">
            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Getting started</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-48 flex flex-col gap-2">
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Introduction</NavigationMenuLink>
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Installation</NavigationMenuLink>
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Typography</NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuTrigger>Components</NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <div className="p-4 w-48 flex flex-col gap-2">
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Alert</NavigationMenuLink>
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Button</NavigationMenuLink>
                      <NavigationMenuLink href="#" className="text-sm hover:underline">Card</NavigationMenuLink>
                    </div>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </Section>

          {/* ── MENUBAR ─────────────────────────────────────────── */}
          <Section title="Menubar">
            <Menubar>
              <MenubarMenu>
                <MenubarTrigger>File</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>New <MenubarShortcut>⌘N</MenubarShortcut></MenubarItem>
                  <MenubarItem>Open <MenubarShortcut>⌘O</MenubarShortcut></MenubarItem>
                  <MenubarSeparator />
                  <MenubarItem>Save <MenubarShortcut>⌘S</MenubarShortcut></MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>Edit</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Undo <MenubarShortcut>⌘Z</MenubarShortcut></MenubarItem>
                  <MenubarItem>Redo <MenubarShortcut>⌘Y</MenubarShortcut></MenubarItem>
                </MenubarContent>
              </MenubarMenu>
              <MenubarMenu>
                <MenubarTrigger>View</MenubarTrigger>
                <MenubarContent>
                  <MenubarItem>Zoom In</MenubarItem>
                  <MenubarItem>Zoom Out</MenubarItem>
                </MenubarContent>
              </MenubarMenu>
            </Menubar>
          </Section>

          {/* ── DROPDOWN MENU ───────────────────────────────────── */}
          <Section title="Dropdown Menu">
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Button variant="outline">Open Menu</Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                <DropdownMenuLabel>My Account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem>Profile <DropdownMenuShortcut>⌘P</DropdownMenuShortcut></DropdownMenuItem>
                  <DropdownMenuItem>Settings <DropdownMenuShortcut>⌘S</DropdownMenuShortcut></DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Log out <DropdownMenuShortcut>⌘Q</DropdownMenuShortcut></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </Section>

          {/* ── CONTEXT MENU ────────────────────────────────────── */}
          <Section title="Context Menu">
            <ContextMenu>
              <ContextMenuTrigger>
                <div className="w-64 h-16 rounded-lg border border-dashed flex items-center justify-center text-sm text-muted-foreground select-none">
                  Right-click here
                </div>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuLabel>Actions</ContextMenuLabel>
                <ContextMenuSeparator />
                <ContextMenuItem>Copy <ContextMenuShortcut>⌘C</ContextMenuShortcut></ContextMenuItem>
                <ContextMenuItem>Paste <ContextMenuShortcut>⌘V</ContextMenuShortcut></ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem>Delete</ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          </Section>

          {/* ── DIALOG ──────────────────────────────────────────── */}
          <Section title="Dialog">
            <Dialog>
              <DialogTrigger>
                <Button variant="outline">Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Confirm action</DialogTitle>
                  <DialogDescription>Are you sure you want to proceed? This cannot be undone.</DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button>Confirm</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </Section>

          {/* ── ALERT DIALOG ────────────────────────────────────── */}
          <Section title="Alert Dialog">
            <AlertDialog>
              <AlertDialogTrigger>
                <Button variant="destructive">Delete Account</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                  <AlertDialogDescription>This will permanently delete your account and remove your data.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction>Delete</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </Section>

          {/* ── SHEET ───────────────────────────────────────────── */}
          <Section title="Sheet">
            {(['top', 'right', 'bottom', 'left'] as const).map((side) => (
              <Sheet key={side}>
                <SheetTrigger>
                  <Button variant="outline" size="sm">{side}</Button>
                </SheetTrigger>
                <SheetContent side={side}>
                  <SheetHeader>
                    <SheetTitle>Sheet ({side})</SheetTitle>
                    <SheetDescription>This sheet slides in from the {side}.</SheetDescription>
                  </SheetHeader>
                </SheetContent>
              </Sheet>
            ))}
          </Section>

          {/* ── DRAWER ──────────────────────────────────────────── */}
          <Section title="Drawer">
            <Drawer>
              <DrawerTrigger>
                <Button variant="outline">Open Drawer</Button>
              </DrawerTrigger>
              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Drawer</DrawerTitle>
                  <DrawerDescription>This is a bottom drawer powered by Vaul.</DrawerDescription>
                </DrawerHeader>
                <DrawerFooter>
                  <Button>Submit</Button>
                  <Button variant="outline">Cancel</Button>
                </DrawerFooter>
              </DrawerContent>
            </Drawer>
          </Section>

          {/* ── TOOLTIP ─────────────────────────────────────────── */}
          <Section title="Tooltip">
            <Tooltip>
              <TooltipTrigger>
                <Button variant="outline">Hover me</Button>
              </TooltipTrigger>
              <TooltipContent>This is a tooltip</TooltipContent>
            </Tooltip>
          </Section>

          {/* ── POPOVER ─────────────────────────────────────────── */}
          <Section title="Popover">
            <Popover>
              <PopoverTrigger>
                <Button variant="outline">Open Popover</Button>
              </PopoverTrigger>
              <PopoverContent>
                <p className="text-sm">This is a popover. Put any content here.</p>
              </PopoverContent>
            </Popover>
          </Section>

          {/* ── HOVER CARD ──────────────────────────────────────── */}
          <Section title="Hover Card">
            <HoverCard>
              <HoverCardTrigger>
                <Button variant="link">@shadcn</Button>
              </HoverCardTrigger>
              <HoverCardContent className="w-64">
                <div className="flex gap-3">
                  <Avatar><AvatarImage src="https://github.com/shadcn.png" /><AvatarFallback>CN</AvatarFallback></Avatar>
                  <div>
                    <p className="text-sm font-semibold">@shadcn</p>
                    <p className="text-xs text-muted-foreground">Creator of shadcn/ui</p>
                  </div>
                </div>
              </HoverCardContent>
            </HoverCard>
          </Section>

          {/* ── CAROUSEL ────────────────────────────────────────── */}
          <Section title="Carousel">
            <Carousel className="w-72">
              <CarouselContent>
                {Array.from({ length: 5 }, (_, i) => (
                  <CarouselItem key={i}>
                    <Card>
                      <CardContent className="flex aspect-square items-center justify-center p-6">
                        <span className="text-4xl font-semibold">{i + 1}</span>
                      </CardContent>
                    </Card>
                  </CarouselItem>
                ))}
              </CarouselContent>
              <CarouselPrevious />
              <CarouselNext />
            </Carousel>
          </Section>

          {/* ── CALENDAR ────────────────────────────────────────── */}
          <Section title="Calendar">
            <Calendar
              mode="single"
              selected={calDate}
              onSelect={setCalDate}
              className="rounded-md border"
            />
          </Section>

          {/* ── TOAST ───────────────────────────────────────────── */}
          <Section title="Toast (Sonner)">
            <Button variant="outline" onClick={() => toast('Event created', { description: 'Monday, January 3rd at 6:00pm' })}>Default</Button>
            <Button variant="outline" onClick={() => toast.success('Saved successfully!')}>Success</Button>
            <Button variant="outline" onClick={() => toast.error('Something went wrong')}>Error</Button>
            <Button variant="outline" onClick={() => toast.warning('Heads up!')}>Warning</Button>
            <Button variant="outline" onClick={() => toast.info('FYI: update available')}>Info</Button>
          </Section>

          {/* ── RUBBER HOSE UTILITIES ───────────────────────────── */}
          <Section title="RH Utilities — Text Effects">
            <p className="rh-text-3d text-3xl rh-font-heading">Howdy!</p>
            <p className="rh-text-3d-lg text-4xl rh-font-heading text-rh-red">POW!</p>
            <p className="rh-text-outline text-3xl rh-font-heading">Outline</p>
            <p className="rh-text-3d-red text-3xl rh-font-heading">Red 3D</p>
            <p className="rh-text-3d-blue text-3xl rh-font-heading">Blue 3D</p>
          </Section>

          <Section title="RH Utilities — Panels &amp; Bubbles">
            <div className="rh-panel w-64">
              <div className="rh-panel-header">★ XP Earned</div>
              <div className="rh-panel-body text-sm font-semibold">You gained 250 XP this round!</div>
            </div>
            <div className="rh-speech-bubble max-w-48 text-sm font-semibold mb-6">
              Gosh, what a swell design system!
            </div>
            <div className="rh-think-bubble text-sm font-semibold px-4 py-2 mb-6">
              Hmm...
            </div>
          </Section>

          <Section title="RH Utilities — Stamps &amp; Shadows">
            <span className="rh-stamp rh-stamp-red text-sm">APPROVED</span>
            <span className="rh-stamp rh-stamp-blue text-sm">NEW</span>
            <span className="rh-stamp rh-stamp-green text-sm">DONE</span>
            <div className="w-16 h-16 bg-rh-yellow rh-outline rh-shadow-xl rounded-2xl" />
            <div className="w-16 h-16 bg-rh-red rh-outline rh-shadow-red rounded-2xl" />
            <div className="w-16 h-16 bg-rh-blue rh-outline rh-shadow-blue rounded-2xl" />
            <div className="w-16 h-16 bg-rh-green rh-outline rh-shadow-green rounded-2xl" />
          </Section>

          <Section title="RH Utilities — Patterns">
            <div className="rh-bg-polka rh-outline rh-shadow w-36 h-20 rounded-2xl" />
            <div className="rh-bg-stripes-bold rh-outline rh-shadow w-36 h-20 rounded-2xl" />
            <div className="rh-bg-checker rh-outline rh-shadow w-36 h-20 rounded-2xl" />
            <div className="rh-bg-zigzag rh-outline rh-shadow w-36 h-20 rounded-2xl" />
            <div className="rh-bg-newsprint rh-outline rh-shadow w-36 h-20 rounded-2xl" />
            <div className="rh-bg-carnival-red rh-outline rh-shadow w-36 h-20 rounded-2xl" />
          </Section>

          <Section title="RH Utilities — Animations">
            <button className="rh-outline rh-shadow rh-hover-wobble px-4 py-2 rounded-full font-bold bg-rh-yellow text-rh-black">Wobble</button>
            <button className="rh-outline rh-shadow rh-hover-jelly px-4 py-2 rounded-full font-bold bg-rh-red text-rh-cream">Jelly</button>
            <button className="rh-outline rh-shadow rh-hover-rubber-band px-4 py-2 rounded-full font-bold bg-rh-blue text-rh-cream">Rubber Band</button>
            <button className="rh-outline rh-shadow rh-hover-shake px-4 py-2 rounded-full font-bold bg-rh-green text-rh-cream">Shake</button>
            <button className="rh-outline rh-shadow rh-hover-wiggle px-4 py-2 rounded-full font-bold bg-rh-orange text-rh-black">Wiggle</button>
            <button className="rh-outline rh-shadow rh-hover-heartbeat px-4 py-2 rounded-full font-bold bg-rh-pink text-rh-black">Heartbeat</button>
            <div className="rh-outline rh-shadow rh-animate-float w-14 h-14 rounded-full bg-rh-parchment flex items-center justify-center text-2xl">🎩</div>
          </Section>
        </div>
      </div>
    </TooltipProvider>
  )
}
