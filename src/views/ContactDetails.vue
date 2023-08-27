<template>
  <ion-page>
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-button slot="icon-only" router-link="/contacts" default-href="/contacts" fill="clear" shape="round" >
            <ion-icon :icon="arrowBack" size="large"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-buttons slot="end">
          <ion-button slot="icon-only" fill="clear" name="delete" shape="round" @click="confirmContactDeletion">
            <ion-icon :icon="trashSharp" size="large"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>
    <ion-content>
      <ion-item lines="none" class="avatar-item">
        <ion-avatar class="big-avatar">
          <img alt="Avatar" :src="defaultAvatarUrl" />
        </ion-avatar>
      </ion-item>
      <div class="ion-text-center" style="margin-bottom: 6vh;">
        <ion-text style="font-size: 6vw">{{ fullName }}</ion-text>
      </div>
        <ion-item-sliding v-if="phoneNumber">
          <ion-item lines="none" :detail="false">
            <ion-icon class="custom-icon" :icon="callOutline" size="large"></ion-icon>
            <ion-text>{{ phoneNumber }}</ion-text>
          </ion-item>
          <ion-item-options v-if="phoneNumber">
            <ion-item-option @click="call(phoneNumber)" color="success" style="width: 15vw;">
              <ion-icon :icon="callSharp" size="large"></ion-icon>
            </ion-item-option>
            <ion-item-option @click="copyToClipboard(phoneNumber)" style="width: 15vw;">
              <ion-icon :icon="copy" size="large"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
        <ion-item-sliding style="margin-top: 2%;" v-if="email">
          <ion-item lines="none" :detail="false">
            <ion-icon class="custom-icon" :icon="mailOutline" size="large"></ion-icon>
            <ion-text>{{ email }}</ion-text>
          </ion-item>
          <ion-item-options v-if="email">
            <ion-item-option @click="sendEmail(email)" color="success" style="width: 15vw;">
              <ion-icon :icon="mail" size="large"></ion-icon>
            </ion-item-option>
            <ion-item-option @click="copyToClipboard(email)" style="width: 15vw;">
              <ion-icon :icon="copy" size="large"></ion-icon>
            </ion-item-option>
          </ion-item-options>
        </ion-item-sliding>
        <!-- Birthday -->
        <ion-item lines="none" style="margin-top: 2%;" v-if="birthday">
          <ion-icon class="custom-icon" :icon="calendarOutline" size="large"></ion-icon>
          <ion-text>{{ birthday }}</ion-text>
        </ion-item>
    </ion-content>
  </ion-page>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router'; // Import the useRouter function

import {
  IonAvatar,
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonItem,
  IonItemOption,
  IonItemOptions,
  IonItemSliding,
  IonPage,
  IonText,
  IonToolbar,
  alertController,
} from '@ionic/vue';

import {
  arrowBack,
  callOutline,
  calendarOutline,
  callSharp,
  copy,
  mail,
  mailOutline,
  trashSharp,
} from 'ionicons/icons';

import {
  BirthdayPayload,
  ContactPayload,
  Contacts,
  GetContactOptions,
} from '@capacitor-community/contacts';

import { Clipboard } from '@capacitor/clipboard';
import { EmailComposer } from 'capacitor-email-composer';

// Custom event bus
import EventBus from '@/router/EventBus';

// Initialize Vue Router
const router = useRouter();

// Reactive variables for contact information
const contactId = ref('');
const phoneNumber = ref('');
const email = ref('');
const birthday = ref('');
const fullName = ref('');
const defaultAvatarUrl = '/images/avatar.svg'

// Function to format birthday information
const formatBirthday = (birthday: BirthdayPayload): string => {
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

// Function to get the display name of a contact
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

// Function to show a confirmation dialog before deleting a contact
const confirmContactDeletion = async () => {
  const alert = await alertController.create({
    header: 'Kontakt löschen?',
    message: 'Dieser Kontakt wird endgültig von deinem Gerät gelöscht',
    buttons: [
      {
        text: 'Abbrechen',
        role: 'cancel',
      },
      {
        text: 'Löschen',
        handler: () => {
          deleteContact();
        },
      },
    ],
  });

  await alert.present();
};

// Function to delete a contact
const deleteContact = async () => {
  try {
    await Contacts.deleteContact({
      contactId: contactId.value,
    });
    EventBus.emit('deletedContact');
    router.push('/contacts'); // Redirect after deletion
  } catch (error) {
    console.error('Error deleting contact:', error);
  }
};


// Function to call using href
const call = (phoneNumber: string) => {
  window.location.href = `tel:${phoneNumber}`;
};

// Function to send an email using the Email Composer plugin
const sendEmail = (email: string) => {
  EmailComposer.open({
    to: [email],
  });
};

// Function to copy text to clipboard
const copyToClipboard = async (string: string) => {
  await Clipboard.write({
    string: string,
  });
};

// Fetch and display contact information when the component mounts
onMounted(async () => {
  try {
    const route = useRoute();
    const { id } = route.params;
    contactId.value = Array.isArray(id) ? id[0] : id;

    const options: GetContactOptions = {
      contactId: contactId.value,
      projection: {
        name: true,
        phones: true,
        emails: true,
        birthday: true,
      }
    };

    const result = await Contacts.getContact(options);

    if (result && result.contact) {
      const contact = result.contact;
      fullName.value = getDisplayName(contact);
      phoneNumber.value =
        contact.phones && contact.phones.length > 0
          ? contact.phones[0].number!
          : '';
      email.value =
        contact.emails && contact.emails.length > 0
          ? contact.emails[0].address!
          : '';
      
      if (contact.birthday) {
        const birthdayPayload: BirthdayPayload = contact.birthday;
        birthday.value = formatBirthday(birthdayPayload);
      } else {
        birthday.value = '';
      }
    } else {
      console.error('Selected contact not found.');
    }
  } catch (error) {
    console.error('Error fetching selected contact:', error);
  }
});
</script>

<style>
.avatar-item {
  margin-top: 20vw; 
  margin-bottom: 10vw;
}

.big-avatar {
  width: 45vw; 
  height: 45vw; 
  margin: 0 auto;
}
.text-icon-button {
    width: 100%; 
    text-align: left; 
    display: block; 
  }
.custom-icon {
  margin-right: 5vw;
  margin-left: 5vw;
}
</style>