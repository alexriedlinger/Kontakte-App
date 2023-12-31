<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-button router-link="/contacts/create" fill="clear" expand="full" class="text-icon-button" color="black">
          <ion-icon slot="start" :icon="personAddOutline"></ion-icon>
          Neuen Kontakt erstellen
        </ion-button>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-list>
        <ion-item v-for="contact in sortedContacts" :key="contact.contactId" :router-link="`/contacts/${contact.contactId}`">
          <ion-avatar style="margin-right: 5%;">
            <img alt="Avatar" :src="defaultAvatarUrl">
          </ion-avatar>
          {{ getDisplayName(contact) }}
        </ion-item>
      </ion-list>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import {
  IonAvatar,
  IonButton,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonList,
  IonPage,
  IonToolbar,
  alertController
} from '@ionic/vue';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { BirthdayPayload, ContactPayload, Contacts } from '@capacitor-community/contacts';
import { personAddOutline } from 'ionicons/icons';
import { NativeSettings, AndroidSettings, IOSSettings } from 'capacitor-native-settings';
import { App } from '@capacitor/app';

// Import custom event bus for communication between components
import EventBus from '@/router/EventBus';

const defaultAvatarUrl = '/images/avatar.svg'
const contacts = ref<ContactPayload[]>([]);

const permissionAlert = alertController.create({
    backdropDismiss: false,
    header: 'Berechtigungen erforderlich',
    message: 'Diese App benötigt Berechtigungen für den Zugriff auf deine Kontakte, um richtig zu funktionieren. Möchtest du die App-Einstellungen öffnen?',
    buttons: [
      {
        text: 'Einstellungen öffnen',
        handler: async () => {
          // Open app settings for user to grant permission
          await NativeSettings.open({
            optionAndroid: AndroidSettings.ApplicationDetails,
            optionIOS: IOSSettings.App,
          });
        },
      },
    ],
  })

// Compute a sorted list of contacts by first name
const sortedContacts = computed(() => {
  return contacts.value.slice().sort((a, b) => {
    const firstNameA = (a.name && a.name.given) || '';
    const firstNameB = (b.name && b.name.given) || '';
    return firstNameA.localeCompare(firstNameB);
  });
});

const retrieveContacts = async () => {
        // Define the projection to retrieve specific contact data
        const projection = {
        name: true,
        phones: true,
        };
        // Retrieve contacts using the specified projection
        const result = await Contacts.getContacts({ projection });
        contacts.value = result.contacts;
}


const handlePermissionsAndContacts = async () => {

  try {
    // Check the current permission status
    const permissionStatus = await Contacts.checkPermissions();
    switch (permissionStatus.contacts) {
      case 'granted':
        (await permissionAlert).dismiss()
        .then(result => {
          console.log("Alert dismissed:", result); // Result will be a boolean value
        });
        retrieveContacts();
        break;
      case 'prompt':
        const requestResponse = await Contacts.requestPermissions();
        if (requestResponse.contacts === 'granted') {
          retrieveContacts();
          break
        } else if (requestResponse.contacts === 'prompt-with-rationale') {
            const retryRequestResponse =  await Contacts.requestPermissions();
            if (retryRequestResponse.contacts === 'granted') {
              retrieveContacts();
              break
            } else {
              break
            }
        }
      case 'denied':
          (await permissionAlert).present();
          break
      };
    } catch (error) {
    console.error('Error handling permissions and contacts:', error);
  }
}

// Function to get a display name for a contact
const getDisplayName = (contact: ContactPayload): string => {
  const { name, phones, emails, birthday } = contact;

  if (name && (name.given || name.family)) {
    const firstName = name.given || '';
    const lastName = name.family || '';
    return `${firstName} ${lastName}`;
  } else if (phones && phones.length > 0) {
    return phones[0].number!;
  } else if (emails && emails.length > 0) {
    return emails[0].address!;
  } else if (birthday) {
    return formatBirthday(birthday);
  } else {
    return '';
  }
};

// Function to format birthday information
const formatBirthday = (birthday: BirthdayPayload): string => {
  // Format the birthday using toLocaleDateString
  if (birthday && birthday.year && birthday.month && birthday.day) {
    const formattedDate = new Date(birthday.year, birthday.month - 1, birthday.day).toLocaleDateString(undefined, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });

    return formattedDate;
  } else {
    return '';
  }
};

// Event handler for contact-related events
const handleContactEvent = () => {
  handlePermissionsAndContacts(); // Update contacts when a new contact is created or deleted
};


// Mounting logic
onMounted(() => {
  handlePermissionsAndContacts();
  App.addListener('appStateChange', handleContactEvent);
  EventBus.on('createdContact', handleContactEvent);
  EventBus.on('deletedContact', handleContactEvent);
});

// Unmounting logic
onUnmounted(() => {
  App.removeAllListeners();
  // Detach event listeners when the component is unmounted
  EventBus.off('createdContact', handleContactEvent);
  EventBus.off('deletedContact', handleContactEvent);
});
</script>


<style>
</style>
