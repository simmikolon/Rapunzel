//
//  RPGameSceneViewController.swift
//  RapunzelSwift
//
//  Created by Simon Kemper on 13.11.15.
//  Copyright © 2015 Simon Kemper. All rights reserved.
//

import UIKit
import SpriteKit

class RPGameSceneViewController: RPSKViewController {

    override func viewDidLoad() {
        
        super.viewDidLoad()

        //let screenSize: CGRect = UIScreen.mainScreen().bounds
        let gameScene = RPGameScene(size: CGSizeMake(320.0, 568.0))
        let skView = self.view as! SKView
        
        skView.showsFPS = true
        skView.showsNodeCount = true
        skView.ignoresSiblingOrder = true
        
        gameScene.scaleMode = .AspectFill
        gameScene.setup()

        skView.presentScene(gameScene)
    }
}
