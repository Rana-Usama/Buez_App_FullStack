import {
  StyleSheet,
  Platform,
  View,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  ScrollView,
  StatusBar,
} from "react-native";
import React, { useState, useEffect } from "react";
import { useAppTheme } from "../contexts/themeContext";
import Nav from "../components/common/Nav";
import { RFPercentage } from "react-native-responsive-fontsize";
import { useTranslation } from "react-i18next";
import InputField from "../components/common/AuthInputField";
import { fetchUsersWithTaskStats } from "../services/Review.service";
import Colors from "../config/Colors";
import { Icons } from "../config/theme";
import { Ionicons, MaterialIcons, FontAwesome5, Feather } from "@expo/vector-icons";

const TopRatedUsers = ({ navigation }: any) => {
  const { theme } = useAppTheme();
  const { t } = useTranslation();

  const [searchQuery, setSearchQuery] = useState("");
  const [inputField, SetInputField] = useState([
    { placeholder: "Search top performers...", value: "" },
  ]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // 'all', 'pro', 'rising'

  const handleChange = (text, i) => {
    const tmp = [...inputField];
    tmp[i].value = text;
    SetInputField(tmp);
    setSearchQuery(text);
  };

  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await fetchUsersWithTaskStats();
        // Mock data - replace with actual API response
        const mockUsers = [
          {
            id: 1,
            userName: "Sana Asghar",
            profileImage: null,
            memberSince: "April 4, 2024",
            activeTasks: 3,
            completedTasks: 23,
            successRate: 98,
            type: 'pro',
            rating: 4.9
          },
          {
            id: 2,
            userName: "Alex Johnson",
            profileImage: null,
            memberSince: "March 15, 2024",
            activeTasks: 2,
            completedTasks: 18,
            successRate: 95,
            type: 'pro',
            rating: 4.8
          },
          {
            id: 3,
            userName: "Maria Garcia",
            profileImage: null,
            memberSince: "May 20, 2024",
            activeTasks: 4,
            completedTasks: 12,
            successRate: 92,
            type: 'rising',
            rating: 4.7
          },
          {
            id: 4,
            userName: "David Chen",
            profileImage: null,
            memberSince: "February 8, 2024",
            activeTasks: 1,
            completedTasks: 28,
            successRate: 96,
            type: 'pro',
            rating: 4.9
          },
          {
            id: 5,
            userName: "Emma Wilson",
            profileImage: null,
            memberSince: "June 12, 2024",
            activeTasks: 3,
            completedTasks: 8,
            successRate: 89,
            type: 'rising',
            rating: 4.6
          }
        ];
        setUsers(mockUsers);
      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.userName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || user.type === filter;
    return matchesSearch && matchesFilter;
  });

  const getBadgeInfo = (type) => {
    switch (type) {
      case 'pro':
        return {
          icon: 'diamond',
          text: 'PRO',
          color: '#FFD700',
          bgColor: 'rgba(255, 215, 0, 0.15)',
          borderColor: 'rgba(255, 215, 0, 0.3)'
        };
      case 'rising':
        return {
          icon: 'rocket',
          text: 'RISING',
          color: '#FF6B35',
          bgColor: 'rgba(255, 107, 53, 0.15)',
          borderColor: 'rgba(255, 107, 53, 0.3)'
        };
      default:
        return {
          icon: 'star',
          text: 'TOP',
          color: Colors.primary,
          bgColor: Colors.primary + '15',
          borderColor: Colors.primary + '30'
        };
    }
  };

  const UserCard = ({ user }) => {
    const badgeInfo = getBadgeInfo(user.type);
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          navigation.navigate("TopRatedUserProfile", { user });
        }}
        style={[styles.userCard, { backgroundColor: theme.white, borderColor: theme.border }]}
      >
        {/* User Info Row */}
        <View style={styles.userInfoRow}>
          <View style={styles.avatarContainer}>
            <Image
              source={user.profileImage ? { uri: user.profileImage } : Icons.dp}
              style={styles.avatar}
            />
            <View style={[styles.onlineStatus, { backgroundColor: '#45B356' }]} />
          </View>

          <View style={styles.userDetails}>
            <View style={styles.nameRow}>
              <Text style={[styles.userName, { color: theme.heading }]} numberOfLines={1}>
                {user.userName}
              </Text>
              <View style={[styles.badge, { 
                backgroundColor: badgeInfo.bgColor,
                borderColor: badgeInfo.borderColor
              }]}>
                <Ionicons name={badgeInfo.icon} size={RFPercentage(1.2)} color={badgeInfo.color} />
                <Text style={[styles.badgeText, { color: badgeInfo.color }]}>
                  {badgeInfo.text}
                </Text>
              </View>
            </View>
            
            <Text style={[styles.memberSince, { color: theme.grey }]}>
              Member since {user.memberSince}
            </Text>

            {/* Stats Row */}
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <MaterialIcons name="pending-actions" size={RFPercentage(1.4)} color={Colors.primary} />
                <Text style={[styles.statValue, { color: theme.heading }]}>
                  {user.activeTasks}
                </Text>
                <Text style={[styles.statLabel, { color: theme.grey }]}>Active</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <FontAwesome5 name="check-circle" size={RFPercentage(1.2)} color="#45B356" />
                <Text style={[styles.statValue, { color: theme.heading }]}>
                  {user.completedTasks}
                </Text>
                <Text style={[styles.statLabel, { color: theme.grey }]}>Done</Text>
              </View>

              <View style={styles.statDivider} />

              <View style={styles.statItem}>
                <Ionicons name="trending-up" size={RFPercentage(1.4)} color="#FF6B35" />
                <Text style={[styles.statValue, { color: theme.heading }]}>
                  {user.successRate}%
                </Text>
                <Text style={[styles.statLabel, { color: theme.grey }]}>Success</Text>
              </View>
            </View>
          </View>

          <View style={styles.arrowContainer}>
            <Feather name="chevron-right" size={RFPercentage(2)} color={theme.primary} />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const FilterButton = ({ title, value, isActive }) => (
    <TouchableOpacity
      style={[
        styles.filterButton,
        isActive && [styles.activeFilterButton, { backgroundColor: Colors.primary }]
      ]}
      onPress={() => setFilter(value)}
    >
      <Text style={[
        styles.filterButtonText,
        isActive ? styles.activeFilterButtonText : { color: theme.darkGrey }
      ]}>
        {title}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.white }]}>
      <StatusBar barStyle={theme.mode === "dark" ? "light-content" : "dark-content"} />
      
      <Nav
        marginTop={RFPercentage(5)}
        leftLogo={false}
        navigation={navigation}
        title={"Top Performers"}
        dpNull
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Search Section */}
        <View style={styles.searchSection}>
          {inputField?.map((item, i) => (
            <View key={i} style={styles.inputFieldWrapper}>
              <InputField
                placeholder={item.placeholder}
                placeholderColor={theme.grey}
                height={RFPercentage(5.5)}
                backgroundColor={theme.white}
                borderWidth={1}
                borderColor={theme.border}
                secure={item.secure}
                borderRadius={RFPercentage(1.2)}
                color={theme.heading}
                fontSize={RFPercentage(1.6)}
                fontFamily={"Poppins_400Regular"}
                handleFeild={(text) => handleChange(text, i)}
                value={item.value}
                width={"100%"}
                icon="search"
                iconColor={theme.grey}
              />
            </View>
          ))}
        </View>

        {/* Filter Section */}
        <View style={styles.filterSection}>
          <Text style={[styles.filterTitle, { color: theme.heading }]}>
            Filter by:
          </Text>
          <View style={styles.filterButtons}>
            <FilterButton title="All" value="all" isActive={filter === 'all'} />
            <FilterButton title="Pro" value="pro" isActive={filter === 'pro'} />
            <FilterButton title="Rising" value="rising" isActive={filter === 'rising'} />
          </View>
        </View>

        {/* Results Count */}
        <View style={styles.resultsSection}>
          <Text style={[styles.resultsText, { color: theme.darkGrey }]}>
            {filteredUsers.length} {filteredUsers.length === 1 ? 'performer' : 'performers'} found
          </Text>
        </View>

        {/* Users List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={[styles.loadingText, { color: theme.darkGrey }]}>
              Loading top performers...
            </Text>
          </View>
        ) : filteredUsers.length > 0 ? (
          <View style={styles.usersList}>
            {filteredUsers.map((user) => (
              <UserCard key={user.id} user={user} />
            ))}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons 
              name="people-outline" 
              size={RFPercentage(8)} 
              color={theme.grey} 
            />
            <Text style={[styles.emptyTitle, { color: theme.heading }]}>
              No performers found
            </Text>
            <Text style={[styles.emptyText, { color: theme.grey }]}>
              {searchQuery ? 'Try adjusting your search terms' : 'No top performers available at the moment'}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default TopRatedUsers;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: RFPercentage(10),
  },
  searchSection: {
    paddingHorizontal: RFPercentage(2),
    paddingTop: RFPercentage(2),
  },
  inputFieldWrapper: {
    marginBottom: RFPercentage(1),
  },
  filterSection: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(2),
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  filterTitle: {
    fontSize: RFPercentage(1.8),
    fontFamily: "Poppins_600SemiBold",
    marginBottom: RFPercentage(1),
  },
  filterButtons: {
    flexDirection: 'row',
  },
  filterButton: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1),
    borderRadius: RFPercentage(1),
    marginRight: RFPercentage(1),
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  activeFilterButton: {
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterButtonText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_500Medium",
  },
  activeFilterButtonText: {
    color: Colors.white,
  },
  resultsSection: {
    paddingHorizontal: RFPercentage(2),
    paddingVertical: RFPercentage(1.5),
  },
  resultsText: {
    fontSize: RFPercentage(1.4),
    fontFamily: "Poppins_500Medium",
  },
  usersList: {
    paddingHorizontal: RFPercentage(2),
  },
  userCard: {
    borderRadius: RFPercentage(1.5),
    borderWidth: 1,
    padding: RFPercentage(2),
    marginBottom: RFPercentage(1.5),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  userInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: RFPercentage(1.5),
  },
  avatar: {
    width: RFPercentage(6),
    height: RFPercentage(6),
    borderRadius: RFPercentage(1.5),
    borderWidth: 2,
    borderColor: Colors.primary + '20',
  },
  onlineStatus: {
    position: 'absolute',
    bottom: RFPercentage(0.2),
    right: RFPercentage(0.2),
    width: RFPercentage(1.2),
    height: RFPercentage(1.2),
    borderRadius: RFPercentage(0.6),
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: RFPercentage(0.5),
  },
  userName: {
    fontSize: RFPercentage(1.7),
    fontFamily: "Poppins_600SemiBold",
    marginRight: RFPercentage(1),
    flex: 1,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: RFPercentage(0.8),
    paddingVertical: RFPercentage(0.3),
    borderRadius: RFPercentage(0.8),
    borderWidth: 1,
  },
  badgeText: {
    fontSize: RFPercentage(1),
    fontFamily: "Poppins_600SemiBold",
    marginLeft: RFPercentage(0.3),
  },
  memberSince: {
    fontSize: RFPercentage(1.3),
    fontFamily: "Poppins_400Regular",
    marginBottom: RFPercentage(1),
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: RFPercentage(1),
    padding: RFPercentage(1),
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_700Bold",
    marginTop: RFPercentage(0.3),
  },
  statLabel: {
    fontSize: RFPercentage(1.1),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(0.2),
  },
  statDivider: {
    width: 1,
    height: RFPercentage(2.5),
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  arrowContainer: {
    marginLeft: RFPercentage(1),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RFPercentage(10),
  },
  loadingText: {
    fontSize: RFPercentage(1.6),
    fontFamily: "Poppins_400Regular",
    marginTop: RFPercentage(1),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: RFPercentage(10),
    paddingHorizontal: RFPercentage(4),
  },
  emptyTitle: {
    fontSize: RFPercentage(2),
    fontFamily: "Poppins_600SemiBold",
    marginTop: RFPercentage(2),
    marginBottom: RFPercentage(1),
  },
  emptyText: {
    fontSize: RFPercentage(1.5),
    fontFamily: "Poppins_400Regular",
    textAlign: 'center',
    lineHeight: RFPercentage(2.2),
  },
});