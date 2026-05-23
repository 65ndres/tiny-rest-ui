import React from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';
import ScreenComponent from '../sharedComponents/ScreenComponent';

const { height } = Dimensions.get('window');

const PRIVACY_POLICY_TEXT = `
Last Updated: May 9, 2026

Introduction
Promesas is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mobile application. Please read this Privacy Policy carefully. By using the App, you agree to the collection and use of information in accordance with this policy.

Information We Collect
Promesas is designed with privacy in mind. We collect minimal information necessary to provide you with the best experience:

Local Data: The App stores your favorite verses and preferences locally on your device. This information is not transmitted to our servers.
Usage Data: We may collect anonymous usage statistics to improve the App's performance and user experience. This data does not personally identify you.
How We Use Your Information
We use the information we collect to:

Provide, maintain, and improve the App's functionality
Personalize your experience within the App
Analyze usage patterns to enhance user experience
Respond to your inquiries and provide customer support
Data Storage and Security
Your personal data, including favorite verses and preferences, is stored locally on your device. We do not transmit this data to external servers. We implement appropriate technical and organizational measures to protect your information, though no method of transmission over the Internet or electronic storage is 100% secure.

Third-Party Services
Promesas may use third-party services that have their own privacy policies. We are not responsible for the privacy practices of these third parties. We encourage you to review their privacy policies.

Apple App Store: When you download Promesas through the Apple App Store, your use is also governed by Apple's Privacy Policy and Terms of Service.
Children's Privacy
Promesas is not intended for children under the age of 13. We do not knowingly collect personal information from children under 13. If you are a parent or guardian and believe your child has provided us with personal information, please contact us so we can delete such information.

Your Rights
You have the right to:

Access and review your local data stored in Promesas
Delete your local data at any time by uninstalling Promesas
Opt out of any data collection features (if applicable)
Changes to This Privacy Policy
We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last Updated" date. You are advised to review this Privacy Policy periodically for any changes.

Contact Us
If you have any questions about this Privacy Policy, please contact us:

Through the contact form on this website
Via email at the contact address provided in the App Store listing
By using Promesas, you acknowledge that you have read and understood this Privacy Policy.`;

const PrivacyPolicyScreen: React.FC = () => (
  <ScreenComponent>
    <View style={{ paddingTop: height * 0.05, paddingBottom: height * 0.05 }}>
    <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.body}>{PRIVACY_POLICY_TEXT}</Text>
      </ScrollView>
    </View>
  </ScreenComponent>
);

const styles = StyleSheet.create({
  content: {
    paddingTop: height * 0.02,
    paddingBottom: height * 0.05,
  } as ViewStyle,
  body: {
    color: 'white',
    fontSize: height * 0.02,
    fontWeight: '400',
    lineHeight: height * 0.03,
  } as TextStyle,
});

export default PrivacyPolicyScreen;
