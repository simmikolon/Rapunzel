//
//  RPGameOverScene.swift
//  Rapunzel
//
//  Created by Simon Kemper on 02.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import UIKit

class RPGameOverScene: RPScene {

    override func touchesBegan(touches: Set<UITouch>, withEvent event: UIEvent?) {
        
        let screenSize = CGSize(width: RPGameSceneSettings.width, height: RPGameSceneSettings.height)
        let gameScene = RPGameScene(size: screenSize)
        let skView = self.view!
        
        gameScene.scaleMode = .AspectFill
        skView.presentScene(gameScene)
    }
}
