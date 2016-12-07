$(document).ready(function(){
  
  //Analyse-Daten:
  var wettbewerber = ["vwfsde", "ingdiba", "comdirect", "FidorCommBanking", "DeutscheKreditbankAG", "CortalConsorsDe", "CommerzbankPrivat", "DeutscheBankGruppe", "ally", "barclaysonline", "new_competitor"];
  var kriterien = ["Channel", "Subscriptions", "Videos_Count", "Avg_Views_per_Video", "Avg_Likes_per_Video", "Most_Successful_Video_Views", "Most_Successful_Video_Likes", "Avg_Views_compared_to_Subs", "Avg_Engagement_Rate_per_Video"];
  
  //API-Daten:
  var key = "AIzaSyALPLLisEyYHg0CB_MUu78UuG_LnYFnQu8";
  var sinceDate = new Date();
  sinceDate.setDate(sinceDate.getDate() - 30);
  console.log(sinceDate);
  
  //Create Table:
  var tableData = createTable("containerTable", wettbewerber, kriterien);

  //Functions:
  function round(value, precision) {
    var multiplier = Math.pow(10, precision || 0);
    var rounded = Math.round(value * multiplier) / multiplier;
    return rounded.toFixed(precision);
  }
  
  function numberWithCommas(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  }
  
  function createTable(container_id, wettbewerber, kriterien) {
    var containerTable = document.getElementById(container_id);
    var table = document.createElement("table");
    table.id = "dashboard";
    table.className = "table";
    table.className += " table-striped table-hover sortable";
    containerTable.appendChild(table);
    var tableData = {};
    tableData.header = {};
    //Append thead and tbody:
    var thead = document.createElement("thead");
    thead.id = "thead";
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    tbody.id = "tbody"
    table.appendChild(tbody);
    var tfoot = document.createElement("tfoot");
    tfoot.id = "tfoot"
    table.appendChild(tfoot);
    for (i=0; i<wettbewerber.length; i++) {
      tableData[wettbewerber[i]] = {};
    };
    for (i=0; i<=wettbewerber.length; i++) {
      var tr = document.createElement("tr");
      tr.id = i;
      for (x=0; x<kriterien.length; x++) {
        switch (i) {
          case 0:
            var th = document.createElement("th");
            th.id = kriterien[x];
            //Change th names that are shown to make display more pleasing:
            switch (x) {
              case 2:
                th.innerHTML = "Uploads";
                break;
              case 3:
                th.innerHTML = "&Oslash; Views";
                break;
              case 4:
                th.innerHTML = "&Oslash; Likes";
                break;
              case 5:
                th.innerHTML = "Top Views";
                break;
              case 6:
                th.innerHTML = "Top Likes";
                break;
              case 7:
                th.innerHTML = "<sup>&Oslash; Views</sup>&frasl;<sub>Subscr.</sub>";
                break;
              case 8:
                th.innerHTML = "Engagement Rate";
                break;
              default:
                th.innerHTML = kriterien[x];
                break;
            }
            tr.appendChild(th);
            tableData.header[kriterien[x]] = th;
            thead.appendChild(tr);
            break;
          case wettbewerber.length:
            var td = document.createElement("td");
            td.id = wettbewerber[i-1] + "_" + kriterien[x];
            td.className = wettbewerber[i-1] + " " + kriterien[x];
            if(x>0){
              td.className += " number";
            } else {
              var input = document.createElement("input");
              input.id = "competitor_input";
              input.setAttribute("type", "text");
              input.setAttribute("placeholder", "+ Add Channel");
              td.appendChild(input);
            }
            tr.appendChild(td);
            tfoot.appendChild(tr);
            tableData[wettbewerber[i-1]][kriterien[x]] = td;
            break;
          default:
            var td = document.createElement("td");
            td.id = wettbewerber[i-1] + "_" + kriterien[x];
            td.className = wettbewerber[i-1] + " " + kriterien[x];
            if(x>0){
              td.className += " number";
            }
            //td.innerHTML = wettbewerber[i-1] + " " + kriterien[x];
            tr.appendChild(td);
            tbody.appendChild(tr);
            tableData[wettbewerber[i-1]][kriterien[x]] = td;
            break;
        }
      };
    };
    sorttable.makeSortable(table);
    return tableData;
  }
  
  function sortByDate(list){
    return list.sort(function(a, b) {
      var aDate = new Date(a.snippet.publishedAt);
      var bDate = new Date(b.snippet.publishedAt);
      if (aDate > bDate) {
        return -1;
      } else if (aDate < bDate) {
        return 1;
      } else {
        return 0;
      };
    });
  }
  
  function fillChannelName(page_name, tableData){
    tableData[page_name].Channel.innerHTML = page_name;
    var table = document.getElementById("dashboard");
    sorttable.makeSortable(table);
  }
  
  function fillSubscriptions(page_name, tableData){
    jQuery.getJSON("https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername="+page_name+"&key="+key, function(response) {
      //Check if Channel exists:
      if (response.items.length == 0) {
        tableData[page_name].Subscriptions.innerHTML = "Channel not found.";
      } else {
        var sub_count = response.items[0].statistics.subscriberCount;
        sub_count = numberWithCommas(sub_count);
        tableData[page_name].Subscriptions.innerHTML = sub_count;
        var table = document.getElementById("dashboard");
        sorttable.makeSortable(table);
      }
    }); 
  }
  
  function fillVideos_Count(page_name, tableData){
    //Can handle max. of 50 Videos per month.
    jQuery.getJSON("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername="+page_name+"&key="+key, function(response) {
      var uploads_id = response.items[0].contentDetails.relatedPlaylists.uploads;
      jQuery.getJSON("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId="+uploads_id+"&maxResults=50&key="+key, function(response) {
        //Check if video was was published less than 30 days ago:
        var vids = response.items;
        vids = sortByDate(vids);
        var vid_count = 0;
        var vids_since = [];
        for (i=0; i<vids.length; i++) {
          var vid_date = new Date(vids[i].snippet.publishedAt);
          if (vid_date > sinceDate) {
            //If yes: vid_count += 1
            vid_count++;
            vids_since.push(vids[i]);
          } else {
            //If older: end loop
            break;
          };
        };
        tableData[page_name].Videos_Count.innerHTML = vid_count;
        var table = document.getElementById("dashboard");
        sorttable.makeSortable(table);
      }); 
    }); 
  }
  
  function getUploadsSince(uploads, sinceDate){
    //Get Uploads since 30 days ago.
    var uploads_since = [];
    for (i=0; i<uploads.length; i++) {
      var vid_date = new Date(uploads[i].snippet.publishedAt);
      if (vid_date > sinceDate) {
        //If younger: add video to uploads_since
        uploads_since.push(uploads[i]);
      } else {
        //If older: end loop
        break;
      };
    };
    return uploads_since;
  }
  
  function getUploadsPlaylist(page_name, callbackFunction){
    //Get Uploads Playlist.
    jQuery.getJSON("https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername="+page_name+"&key="+key, function handleChannelDetails(response){
      var uploads_id = response.items[0].contentDetails.relatedPlaylists.uploads;
      jQuery.getJSON("https://www.googleapis.com/youtube/v3/playlistItems?part=snippet,contentDetails&playlistId="+uploads_id+"&maxResults=50&key="+key, callbackFunction);
    });
  }
  
  function fillAvg_Views_per_Video(page_name, tableData) {
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Get Number of Uploads since 30 days ago.
      var num_uploads_since = uploads_since.length;
      //If no uploads in last 30 days:
      if (num_uploads_since == 0) {
        tableData[page_name].Avg_Views_per_Video.innerHTML = 0;
      } else {
        //Get Views per uploaded Video.
        var views_total = 0;
        var successful_call_counter = 0;
        for (i=0; i<uploads_since.length; i++){
          var video_id = uploads_since[i].contentDetails.videoId;
          jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
            var statistics = response.items[0].statistics;
            var view_count = parseInt(statistics.viewCount, 10);
            //Add Views to views_total.
            views_total += view_count;
            //Add to counter of successful Statistic Calls:
            successful_call_counter++;
            //If all calls were successful:
            if (successful_call_counter == num_uploads_since) {
              //Get Average Views per Video.
              var avg_views_per_video = views_total / num_uploads_since;
              //Round Average Views per Video.
              var avg_views_per_video_rounded = round(avg_views_per_video, 0);
              avg_views_per_video_rounded = numberWithCommas(avg_views_per_video_rounded);
              //Fill tableData with rounded Average View per Video.
              tableData[page_name].Avg_Views_per_Video.innerHTML = avg_views_per_video_rounded;
              var table = document.getElementById("dashboard");
              sorttable.makeSortable(table);
            };
          });
        };
      }
    });
  }
  
  function fillAvg_Likes_per_Video(page_name, tableData) {
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Get Number of Uploads since 30 days ago.
      var num_uploads_since = uploads_since.length;
      //If no uploads in last 30 days:
      if (num_uploads_since == 0) {
        tableData[page_name].Avg_Likes_per_Video.innerHTML = 0;
      } else {
        //Get Likes per uploaded Video.
        var likes_total = 0;
        var successful_call_counter = 0;
        for (i=0; i<uploads_since.length; i++){
          var video_id = uploads_since[i].contentDetails.videoId;
          jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
            var statistics = response.items[0].statistics;
            var like_count = parseInt(statistics.likeCount, 10);
            //Add Likes to likes_total.
            likes_total += like_count;
            //Add to counter of successful Statistic Calls:
            successful_call_counter++;
            //If all calls were successful:
            if (successful_call_counter == num_uploads_since) {
              //Get Average Likes per Video.
              var avg_likes_per_video = likes_total / num_uploads_since;
              //Round Average Likes per Video.
              var avg_likes_per_video_rounded = round(avg_likes_per_video, 1);
              avg_likes_per_video_rounded = numberWithCommas(avg_likes_per_video_rounded);
              //Fill tableData with rounded Average Likes per Video.
              tableData[page_name].Avg_Likes_per_Video.innerHTML = avg_likes_per_video_rounded;
              var table = document.getElementById("dashboard");
              sorttable.makeSortable(table);
            };
          });
        };
      };
    });
  }
  
  function appendPageDiv(page_name) {
    var div_page = document.createElement("div");
    div_page.id = page_name + "_details";
    div_page.className = "container";
    $("#details").append(div_page);
    var header = document.createElement("h2");
    header.innerHTML = page_name;
    $(div_page).append(header);
  }
  
  function appendEmbeddedVideo(video_id, element_id, parent_id) {
    var ifrm = document.createElement("iframe");
    ifrm.setAttribute("src", "https://www.youtube.com/embed/"+video_id);
    ifrm.setAttribute("width", "560");
    ifrm.setAttribute("height", "315");
    ifrm.setAttribute("frameborder", "0");
    ifrm.id = element_id;
    $("#"+parent_id).append(ifrm);
  }
  
  function appendViewCount(view_count, element_id, parent_id) {
    var para = document.createElement("p");
    para.id = element_id;
    para.innerHTML = "Views: " + view_count;
    $("#"+parent_id).append(para);
  }
  
  function fillMost_Successful_Video_Views(page_name, tableData) {
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Set Call Counter.
      var successful_call_counter = 0;
      var num_uploads_since = uploads_since.length;
      //If no uploads:
      if (num_uploads_since == 0) {
        tableData[page_name].Most_Successful_Video_Views.innerHTML = "No Videos";
        //Append Paragraph "No Videos" To div#details:
        var para = document.createElement("p");
        para.id = page_name+"_view_count";
        para.innerHTML = "No Videos";
        $("#"+page_name+"_details").append(para);
      } else {
        //Get Views of first Upload.
        var video_id = uploads_since[0].contentDetails.videoId;
        jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
          var statistics = response.items[0].statistics;
          var view_count = parseInt(statistics.viewCount, 10);
          //Set first Upload as Champion.
          var view_count_champion = view_count;
          var most_successful_video_id = video_id;
          //Add to counter of successful Statistic Calls:
          successful_call_counter++;
          //If only 1 upload:
          if (num_uploads_since == 1) {
            view_count_champion = numberWithCommas(view_count_champion);
            tableData[page_name].Most_Successful_Video_Views.innerHTML = view_count_champion;
            //Append Video Player To div#details:
            appendEmbeddedVideo(video_id, page_name+"_ytapiplayer", page_name+"_details");
            appendViewCount(view_count_champion, page_name+"_view_count", page_name+"_details")
          } else {
            //Let other Videos challenge Champion:
            for (i=1; i<num_uploads_since; i++) {
              //Get Views of next Upload.
              video_id = uploads_since[i].contentDetails.videoId;
              jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
                var statistics = response.items[0].statistics;
                var view_count = parseInt(statistics.viewCount, 10);
                //Add to counter of successful Statistic Calls:
                successful_call_counter++;
                //Challenge Champion.
                var view_count_challenger = view_count;
                //If Success: Replace Champion.
                if (view_count_challenger > view_count_champion) {
                  view_count_champion = view_count_challenger;
                  most_successful_video_id = video_id;
                }
                //If all calls were successful:
                if (successful_call_counter == num_uploads_since) {
                  //Fill tableData with Most Successful Video Views:
                  view_count_champion = numberWithCommas(view_count_champion);
                  tableData[page_name].Most_Successful_Video_Views.innerHTML = view_count_champion;
                  var table = document.getElementById("dashboard");
                  sorttable.makeSortable(table);
                  //Append Video Player To div#details:
                  appendEmbeddedVideo(video_id, page_name+"_ytapiplayer", page_name+"_details");
                  appendViewCount(view_count_champion, page_name+"_view_count", page_name+"_details")
                };
              });
            };
          }
        });
      }
    });
  }
  
  function fillMost_Successful_Video_Likes(page_name, tableData) {
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Set Call Counter.
      var successful_call_counter = 0;
      var num_uploads_since = uploads_since.length;
      //If no uploads:
      if (num_uploads_since == 0) {
        tableData[page_name].Most_Successful_Video_Likes.innerHTML = 0;
      } else {
        //Get Likes of first Upload.
        var video_id = uploads_since[0].contentDetails.videoId;
        jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
          var statistics = response.items[0].statistics;
          var like_count = parseInt(statistics.likeCount, 10);
          //Set first Upload as Champion.
          var like_count_champion = like_count;
          var most_successful_video_id = video_id;
          //Add to counter of successful Statistic Calls:
          successful_call_counter++;
          //If only 1 upload:
          if (num_uploads_since == 1) {
            tableData[page_name].Most_Successful_Video_Likes.innerHTML = like_count_champion;
          } else {
            //Let other Videos challenge Champion:
            for (i=1; i<num_uploads_since; i++) {
              //Get Likes of next Upload.
              video_id = uploads_since[i].contentDetails.videoId;
              jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
                var statistics = response.items[0].statistics;
                var like_count = parseInt(statistics.likeCount, 10);
                //Add to counter of successful Statistic Calls:
                successful_call_counter++;
                //Challenge Champion.
                var like_count_challenger = like_count;
                //If Success: Replace Champion.
                if (like_count_challenger > like_count_champion) {
                  like_count_champion = like_count_challenger;
                  most_successful_video_id = video_id;
                }
                //If all calls were successful:
                if (successful_call_counter == num_uploads_since) {
                  //Fill tableData with Most Successful Video Views:
                  like_count_champion = numberWithCommas(like_count_champion);
                  tableData[page_name].Most_Successful_Video_Likes.innerHTML = like_count_champion;
                  var table = document.getElementById("dashboard");
                  sorttable.makeSortable(table);
                };
              });
            };
          }
        });
      }
    });
  }
  
  function fillAvg_Views_compared_to_Subs(page_name, tableData) {
    var avg_views = 0;
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Get Number of Uploads since 30 days ago.
      var num_uploads_since = uploads_since.length;
      //If no uploads in last 30 days:
      if (num_uploads_since == 0) {
        tableData[page_name].Avg_Views_compared_to_Subs.innerHTML = "No Videos";
      } else {
        //Get Views per uploaded Video.
        var views_total = 0;
        var successful_call_counter = 0;
        for (i=0; i<uploads_since.length; i++){
          var video_id = uploads_since[i].contentDetails.videoId;
          jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
            var statistics = response.items[0].statistics;
            var view_count = parseInt(statistics.viewCount, 10);
            //Add Views to views_total.
            views_total += view_count;
            //Add to counter of successful Statistic Calls:
            successful_call_counter++;
            //If all calls were successful:
            if (successful_call_counter == num_uploads_since) {
              //Get Average Views per Video.
              var avg_views_per_video = views_total / num_uploads_since;
              //Round Average Views per Video.
              var avg_views_per_video_rounded = round(avg_views_per_video, 0);
              //Avg Views is rounded Average Views per Video.
              avg_views = avg_views_per_video_rounded;
              //Get Subscriptions of Channel.
              jQuery.getJSON("https://www.googleapis.com/youtube/v3/channels?part=statistics&forUsername="+page_name+"&key="+key, function(response) {
                var sub_count = response.items[0].statistics.subscriberCount;
                //If no Subscriptions:
                if (sub_count==0) {
                  tableData[page_name].Avg_Views_compared_to_Subs.innerHTML = "No Subscriptions";
                } else {
                  //Divide Average Views per Video by Subscriptions of Channel.
                  var avg_views_compared_subs = avg_views/sub_count;
                  var avg_views_compared_subs_rounded_perc = round(avg_views_compared_subs*100, 1);
                  //Fill tableData with Average Views compared to Subs.
                  tableData[page_name].Avg_Views_compared_to_Subs.innerHTML = avg_views_compared_subs_rounded_perc.toString() + "%";
                  var table = document.getElementById("dashboard");
                  sorttable.makeSortable(table);
                }
              });
            };
          });
        };
      }
    });
  }
  
  function fillAvg_Engagement_Rate_per_Video(page_name, tableData) {
    var engagement_total = 0;
    //Get Uploads Playlist.
    getUploadsPlaylist(page_name, function(response){
      //Get Uploads since 30 days ago.
      var uploads = response.items;
      uploads = sortByDate(uploads);
      var uploads_since = getUploadsSince(uploads, sinceDate);
      //Get Number of Uploads since 30 days ago.
      var num_uploads_since = uploads_since.length;
      //If no uploads in last 30 days:
      if (num_uploads_since == 0) {
        tableData[page_name].Avg_Engagement_Rate_per_Video.innerHTML = "No Videos";
      } else {
        //Get Views per uploaded Video.
        var views_total = 0;
        var likes_total = 0;
        var dislikes_total = 0;
        var comments_total = 0;
        var successful_call_counter = 0;
        for (i=0; i<uploads_since.length; i++){
          var video_id = uploads_since[i].contentDetails.videoId;
          jQuery.getJSON("https://www.googleapis.com/youtube/v3/videos?part=statistics&id="+video_id+"&key="+key, function handleVideoStatistics(response){
            //Get Video Statistics
            var statistics = response.items[0].statistics;
            var view_count = parseInt(statistics.viewCount, 10);
            var like_count = parseInt(statistics.likeCount, 10);
            var dislike_count = parseInt(statistics.dislikeCount, 10);
            var comment_count = parseInt(statistics.commentCount, 10);
            //Add Stats to Total.
            views_total += view_count;
            likes_total += like_count;
            dislikes_total += dislike_count;
            comments_total += comment_count;
            engagement_total = likes_total + dislikes_total + comments_total;
            //Add to counter of successful Statistic Calls:
            successful_call_counter++;
            //If all calls were successful:
            if (successful_call_counter == num_uploads_since) {
              //Get Average Engagement Rate per Video.
              var avg_engagement_rate_per_video = engagement_total / views_total;
              //Round Average Engagement Rate per Video.
              var avg_engagement_rate_per_video_rounded_perc = round(avg_engagement_rate_per_video*100, 3);
              //Fill tableData with Average Engagement Rate per Video.
              tableData[page_name].Avg_Engagement_Rate_per_Video.innerHTML = avg_engagement_rate_per_video_rounded_perc.toString() + "%";
              var table = document.getElementById("dashboard");
              sorttable.makeSortable(table);
            };
          });
        };
      }
    });
  }
  
  //YouTube API:
  for (i=0; i<wettbewerber.length-1; i++){
    appendPageDiv(wettbewerber[i]);
    fillChannelName(wettbewerber[i], tableData);
    fillSubscriptions(wettbewerber[i], tableData);
    fillVideos_Count(wettbewerber[i], tableData);
    fillAvg_Views_per_Video(wettbewerber[i], tableData);
    fillAvg_Likes_per_Video(wettbewerber[i], tableData);
    fillMost_Successful_Video_Views(wettbewerber[i], tableData);
    fillMost_Successful_Video_Likes(wettbewerber[i], tableData);
    fillAvg_Views_compared_to_Subs(wettbewerber[i], tableData);
    fillAvg_Engagement_Rate_per_Video(wettbewerber[i], tableData);
  };
  
  var btnDetails = $("#btnDetails");
  var divDetails = $("#details");
  btnDetails.text("Show Details");
  btnDetails.click(function() {
    divDetails.toggle();
    if(divDetails.is(":visible")){
      btnDetails.text("Hide Details");
    } else {
      btnDetails.text("Show Details");
    }
  });
  
  //If Enter Press in Input Field of Table:
  $(document).on("keyup", "#competitor_input", function(event){
    if(event.which == 13){
      var new_input = $("#competitor_input").val()
      if (tableData.hasOwnProperty(new_input)){
        //If User enters existing Channel Name:
        $("#competitor_input").blur();
        alert("Dieser Channel ist in der Tabelle bereits enthalten.");
      } else {
        //If User enters new Channel Name:
        //Change td.ids to last wettbewerber
        for (x=0; x<kriterien.length; x++) {
          var td = tableData["new_competitor"][kriterien[x]]
          //Set Input Text As last wettbewerber:
          wettbewerber[wettbewerber.length-1] = new_input
          td.id = new_input + "_" + kriterien[x];
          td.className = new_input + " " + kriterien[x];
          if(x>0){
            td.className += " number";
          }
        }
        //Correct tableData Object:
        tableData[new_input] = tableData["new_competitor"];
        delete tableData["new_competitor"]
        //Call YouTube Functions for last wettbewerber
        appendPageDiv(wettbewerber[wettbewerber.length-1]);
        fillChannelName(wettbewerber[wettbewerber.length-1], tableData);
        fillSubscriptions(wettbewerber[wettbewerber.length-1], tableData);
        fillVideos_Count(wettbewerber[wettbewerber.length-1], tableData);
        fillAvg_Views_per_Video(wettbewerber[wettbewerber.length-1], tableData);
        fillAvg_Likes_per_Video(wettbewerber[wettbewerber.length-1], tableData);
        fillMost_Successful_Video_Views(wettbewerber[wettbewerber.length-1], tableData);
        fillMost_Successful_Video_Likes(wettbewerber[wettbewerber.length-1], tableData);
        fillAvg_Views_compared_to_Subs(wettbewerber[wettbewerber.length-1], tableData);
        fillAvg_Engagement_Rate_per_Video(wettbewerber[wettbewerber.length-1], tableData);
        //Append every td tfoot to new tr:
        var new_tr = document.createElement("tr");
        new_tr.id = wettbewerber.length + "_new";
        for (x=0; x<kriterien.length; x++) {
          var new_td = tableData[new_input][kriterien[x]];
          new_tr.appendChild(new_td);
          tableData[new_input][kriterien[x]] = new_td;
        }
        //Append new tr to tbody
        var tbody = document.getElementById("tbody");
        tbody.appendChild(new_tr);
        //Delete old tr from tfoot
        var old_tr = document.getElementById(wettbewerber.length)
        old_tr.parentNode.removeChild(old_tr);
        //Correct id of new tr
        new_tr.id = wettbewerber.length
        //Add "new_competitor" to wettbewerber
        var new_arr_element = "new_competitor"
        wettbewerber.push(new_arr_element);
        //Update tableData Object:
        tableData[new_arr_element] = {};
        //Add tr with input field to table
        var tfoot = document.getElementById("tfoot");
        var tr = document.createElement("tr");
        tr.id = wettbewerber.length;
        for (x=0; x<kriterien.length; x++){
          var td = document.createElement("td");
          td.id = new_arr_element + "_" + kriterien[x];
          td.className = new_arr_element + " " + kriterien[x];
          if(x>0){
            td.className += " number";
          } else {
            var input = document.createElement("input");
            input.id = "competitor_input";
            input.setAttribute("type", "text");
            input.setAttribute("placeholder", "+ Add Channel");
            td.appendChild(input);
          }
          tr.appendChild(td);
          tableData[new_arr_element][kriterien[x]] = td;
        }
        tfoot.appendChild(tr);
        input.focus();
      }
    }
  });
});
