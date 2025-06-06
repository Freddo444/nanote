<template>
  <CommonBaseCard class="px-9 py-5">
    <h1 class="mb-2 flex flex-row items-center text-xl">
      <ul class="flex flex-row gap-2">
        <li v-for="(segment, index) in notebook" :key="index" class="flex flex-row gap-2">
          <span v-if="index > 0">></span>
          <NuxtLink
            class="hover:text-gray-400 dark:hover:text-gray-100"
            :to="`/notebook/${notebook.slice(0, index + 1).join('/')}`">
            {{ segment }}
          </NuxtLink>
        </li>
      </ul>
    </h1>
    <CommonDangerAlert v-if="error" class="mb-4 mt-4">{{ error.data.message }}</CommonDangerAlert>
    <table class="mt-2">
      <thead>
        <tr>
          <th class="text-start text-xs font-medium uppercase text-gray-400">Name</th>
          <th class="hidden text-center text-xs font-medium uppercase text-gray-400 lg:table-cell">Created</th>
          <th class="hidden text-center text-xs font-medium uppercase text-gray-400 lg:table-cell">Updated</th>
          <th class="hidden text-center text-xs font-medium uppercase text-gray-400 lg:table-cell">Contents</th>
          <th class="hidden text-center text-xs font-medium uppercase text-gray-400 lg:table-cell"></th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="note in contents?.notes"
          :key="`nt-${note.name}`"
          class="has-[.delete-button:hover]:text-red-500 has-[.manage-button:hover]:text-blue-500">
          <td class="py-2 align-top">
            <NuxtLink
              :to="`/note/${contents?.pathArray.join('/')}/${note.name}`"
              class="flex flex-row items-center gap-2 hover:text-gray-400 dark:hover:text-gray-100">
              <Icon v-if="note.isMarkdown" name="lucide:file-text" />
              <Icon v-else name="lucide:file" />
              {{ note.name }}
            </NuxtLink>
          </td>
          <td class="hidden py-2 align-top lg:table-cell">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-400">
              <CommonDateDisplay :date="note.createdAt"></CommonDateDisplay>
            </div>
          </td>
          <td class="hidden py-2 align-top lg:table-cell">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-400">
              <CommonDateDisplay :date="note.updatedAt"></CommonDateDisplay>
            </div>
          </td>
          <td class="hidden py-2 text-center align-top text-gray-900 dark:text-gray-400 lg:table-cell">
            {{ note.size?.toFixed(2) }}kb
          </td>
          <td class="py-2 align-middle">
            <div class="flex flex-row place-content-end items-center gap-4">
              <NoteDelete :note :notebooks="note.notebook" class="delete-button"></NoteDelete>
            </div>
          </td>
        </tr>
        <tr
          v-for="nestedNotebook in contents?.notebooks"
          :key="`nb-${nestedNotebook.name}`"
          class="has-[.delete-button:hover]:text-red-500">
          <td class="py-2 align-top">
            <NuxtLink
              class="flex flex-row items-center gap-2 hover:text-gray-400 dark:hover:text-gray-100"
              :to="`/notebook/${contents?.pathArray.join('/')}/${nestedNotebook.name}`">
              <Icon name="lucide:book" class="grow-0" />
              {{ nestedNotebook.name }}
            </NuxtLink>
          </td>
          <td class="hidden py-2 align-top lg:table-cell">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-400">
              <CommonDateDisplay :date="nestedNotebook.createdAt"></CommonDateDisplay>
            </div>
          </td>
          <td class="hidden py-2 align-top lg:table-cell">
            <div class="text-sm font-medium text-gray-900 dark:text-gray-400">
              <CommonDateDisplay :date="nestedNotebook.updatedAt"></CommonDateDisplay>
            </div>
          </td>
          <td class="hidden py-2 text-center align-top text-gray-900 dark:text-gray-400 lg:table-cell">
            {{ nestedNotebook.notebookCount + nestedNotebook.noteCount }}
          </td>
          <td class="py-2 align-middle">
            <div class="flex flex-row place-content-end items-center gap-4">
              <NotebookDelete class="delete-button" :notebook="nestedNotebook"></NotebookDelete>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </CommonBaseCard>
</template>
<script lang="ts" setup>
import type { NotebookContents } from '~/types/notebook'

const route = useRoute()
const notebook: string[] = typeof route.params.notebook === 'string' ? [route.params.notebook] : route.params.notebook
const apiPath = notePathArrayJoiner(notebook)

const { data: contents, error } = useFetch<NotebookContents>(`/api/notebook/${apiPath}`, { immediate: true })
</script>
