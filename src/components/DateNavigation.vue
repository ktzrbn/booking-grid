<template>
  <div class="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-gray-900">Select Date</h3>

      <!-- Mobile: Show current date -->
      <div class="lg:hidden text-sm text-gray-600">
        {{ format(new Date(selectedDate), 'MMM d, yyyy') }}
      </div>
    </div>

    <!-- Desktop: Week view -->
    <div class="hidden lg:block">
      <div class="flex items-center justify-between mb-4">
        <button
          @click="goToPreviousWeek"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>

        <div class="text-sm font-medium text-gray-900">
          {{ formatWeekRange() }}
        </div>

        <button
          @click="goToNextWeek"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>

      <div class="grid grid-cols-7 gap-1">
        <button
          v-for="date in weekDates"
          :key="date"
          @click="setSelectedDate(date)"
          :class="[
            'p-3 text-center rounded-lg transition-all duration-200',
            'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500',
            selectedDate === date
              ? 'bg-primary-600 text-white shadow-md'
              : isToday(date)
                ? 'bg-primary-50 text-primary-700 ring-2 ring-primary-200'
                : 'text-gray-700',
          ]"
        >
          <div class="text-xs font-medium">
            {{ format(new Date(date), 'EEE') }}
          </div>
          <div class="text-lg font-semibold">
            {{ format(new Date(date), 'd') }}
          </div>
        </button>
      </div>
    </div>

    <!-- Mobile: Date picker -->
    <div class="lg:hidden space-y-4">
      <div class="flex items-center space-x-2">
        <button
          @click="goToPreviousDay"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronLeft class="h-5 w-5" />
        </button>

        <input
          v-model="selectedDate"
          type="date"
          :min="format(new Date(), 'yyyy-MM-dd')"
          class="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
          @change="handleDateChange"
        />

        <button
          @click="goToNextDay"
          class="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
        >
          <ChevronRight class="h-5 w-5" />
        </button>
      </div>

      <!-- Quick date buttons -->
      <div class="flex space-x-2 overflow-x-auto pb-2">
        <button
          v-for="quickDate in quickDates"
          :key="quickDate.value"
          @click="setSelectedDate(quickDate.value)"
          :class="[
            'px-3 py-1.5 text-sm font-medium rounded-full whitespace-nowrap transition-colors',
            selectedDate === quickDate.value
              ? 'bg-primary-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
          ]"
        >
          {{ quickDate.label }}
        </button>
      </div>
    </div>

    <!-- Availability Summary -->
    <div class="mt-4 pt-4 border-t border-gray-200">
      <div class="flex items-center justify-between text-sm">
        <div class="flex items-center space-x-4">
          <div class="flex items-center">
            <div class="w-3 h-3 bg-success-400 rounded-full mr-2"></div>
            <span class="text-gray-600">Available</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-warning-400 rounded-full mr-2"></div>
            <span class="text-gray-600">Limited</span>
          </div>
          <div class="flex items-center">
            <div class="w-3 h-3 bg-gray-400 rounded-full mr-2"></div>
            <span class="text-gray-600">Unavailable</span>
          </div>
        </div>

        <button
          @click="setSelectedDate(format(new Date(), 'yyyy-MM-dd'))"
          :class="[
            'text-sm font-medium transition-colors',
            selectedDate === format(new Date(), 'yyyy-MM-dd')
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-primary-600 hover:text-primary-700',
          ]"
          :disabled="selectedDate === format(new Date(), 'yyyy-MM-dd')"
        >
          Today
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { ChevronLeft, ChevronRight } from 'lucide-vue-next'
import { format, addDays, subDays, addWeeks, subWeeks, isToday as dateIsToday } from 'date-fns'
import { useBookingStore } from '@/stores/booking'

const store = useBookingStore()
const { selectedDate, weekDates, setSelectedDate } = store

// Quick date options for mobile
const quickDates = computed(() => {
  const today = new Date()
  return [
    { label: 'Today', value: format(today, 'yyyy-MM-dd') },
    { label: 'Tomorrow', value: format(addDays(today, 1), 'yyyy-MM-dd') },
    { label: format(addDays(today, 2), 'EEE'), value: format(addDays(today, 2), 'yyyy-MM-dd') },
    { label: format(addDays(today, 3), 'EEE'), value: format(addDays(today, 3), 'yyyy-MM-dd') },
    { label: format(addDays(today, 4), 'EEE'), value: format(addDays(today, 4), 'yyyy-MM-dd') },
  ]
})

const isToday = (date: string) => {
  return dateIsToday(new Date(date))
}

const formatWeekRange = () => {
  if (weekDates.length === 0) return ''

  const start = new Date(weekDates[0]!)
  const end = new Date(weekDates[weekDates.length - 1]!)

  if (start.getMonth() === end.getMonth()) {
    return `${format(start, 'MMM d')} - ${format(end, 'd, yyyy')}`
  } else {
    return `${format(start, 'MMM d')} - ${format(end, 'MMM d, yyyy')}`
  }
}

const goToPreviousDay = () => {
  const newDate = format(subDays(new Date(selectedDate), 1), 'yyyy-MM-dd')
  setSelectedDate(newDate)
}

const goToNextDay = () => {
  const newDate = format(addDays(new Date(selectedDate), 1), 'yyyy-MM-dd')
  setSelectedDate(newDate)
}

const goToPreviousWeek = () => {
  const newDate = format(subWeeks(new Date(selectedDate), 1), 'yyyy-MM-dd')
  setSelectedDate(newDate)
}

const goToNextWeek = () => {
  const newDate = format(addWeeks(new Date(selectedDate), 1), 'yyyy-MM-dd')
  setSelectedDate(newDate)
}

const handleDateChange = (event: Event) => {
  const target = event.target as HTMLInputElement
  setSelectedDate(target.value)
}
</script>
