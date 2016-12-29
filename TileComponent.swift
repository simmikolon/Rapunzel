//
//  TileComponent.swift
//  Rapunzel
//
//  Created by Simon Kemper on 07.03.16.
//  Copyright © 2016 Simon Kemper. All rights reserved.
//

import SpriteKit
import GameplayKit

struct TileSet {
    
    let tileSize: CGSize
    let tiles: [SKTexture]
    let startTile: SKTexture?
}

class TileComponent: GKComponent {

    // MARK: Properties
    
    unowned let renderComponent: RenderComponent
    
    let tileSet: TileSet
    var tileNodes: [SKSpriteNode]
    weak var cameraComponent: CameraComponent!
    
    var previousCameraState = CameraState.Resting.rawValue
    
    fileprivate var tileIndex_: Int = 0

    var tileIndex: Int {

        get { return tileIndex_ }

        set(newTileIndex) {

            tileIndex_ = newTileIndex

            if tileIndex_ >= self.tileSet.tiles.count {

                tileIndex_ = 0
            }
            
            else if tileIndex_ < 0 {
                
                tileIndex_ = self.tileSet.tiles.count - 1
            }
        }
    }
    
    fileprivate var upperPositionOffset: CGFloat = 0
    fileprivate var lowerPositionOffset: CGFloat = 0
    fileprivate var offset: CGFloat = 0
    
    // MARK: Initialisation
    
    init(withEntity entity: GKEntity, tileSet: TileSet, offset: CGFloat = 0) {
        
        guard let renderComponent = entity.component(ofType: RenderComponent.self) else {
            fatalError("No Render Component!")
        }
        
        if entity is LayerEntity {
            
            let layerEntity = entity as! LayerEntity
            
            guard let cameraComponent = layerEntity.parallaxScrollingComponent.cameraComponent else {
                fatalError("No Camera Component!")
            }
            
            self.cameraComponent = cameraComponent
        }
        
        self.tileSet = tileSet
        self.renderComponent = renderComponent
        self.tileNodes = []
        
        super.init()
        
        self.upperPositionOffset += offset
        self.lowerPositionOffset += offset
        self.offset = offset
        
        self.createStartupTiles()
    }

    required init?(coder aDecoder: NSCoder) {
        fatalError("init(coder:) has not been implemented")
    }

    func createStartupTiles() {
     
        let screenSize = CGSize(width: GameSceneSettings.width, height: GameSceneSettings.height)
        
        /* This nested function encapsulates adding of tiles as sprites to the render component */
        
        func addTile(withTexture texture: SKTexture, position: CGPoint) {
            
            let tileNode = SKSpriteNode(texture: texture)
            
            tileNode.anchorPoint = CGPoint(x: 0.5, y: 0)
            tileNode.position = position
            
            self.renderComponent.addChild(tileNode)
            self.tileNodes.append(tileNode)
            
            upperPositionOffset += texture.size().height
        }
        
        /* If there is a start-tile we have to add this first */
        
        if (tileSet.startTile != nil) {
            let texture = self.tileSet.startTile!
            addTile(withTexture: texture, position: CGPoint(x: 0, y: upperPositionOffset))
        }
        
        /* Next we fill up the entire screen with tiles */
        
        while (upperPositionOffset < screenSize.height + self.offset) {
            let texture = self.tileSet.tiles[tileIndex]
            addTile(withTexture: texture, position: CGPoint(x: 0, y: upperPositionOffset))
            tileIndex += 1
        }
        
        /* And add an additional line of tiles above */
        /* Since we are moving tiles out of screen back onto screen at the opposite direction */
        /* The additional line makes sure that the whole screen is always covered with tiles */
        
        var texture = self.tileSet.tiles[tileIndex]
        addTile(withTexture: texture, position: CGPoint(x: 0, y: upperPositionOffset))
        tileIndex += 1
        
        /* PROTOTYPING: Needed to add additional second line since there was a gap-glitch after changing tiles to a larger size!!!  */
        /* TODO: Fix this! */
        
        texture = self.tileSet.tiles[tileIndex]
        addTile(withTexture: texture, position: CGPoint(x: 0, y: upperPositionOffset))
        tileIndex += 1
    }
    
    // MARK: Lifecylce Methods
    
    override func update(deltaTime seconds: TimeInterval) {
        
        super.update(deltaTime: seconds)
        
        for tileNode in self.tileNodes {
            
            let absolutePosition = renderComponent.node.scene!.convert(tileNode.position, from: tileNode.parent!)
            
            /* Camera is moving up */
            
            if cameraComponent.cameraState == CameraState.MovingNorth.rawValue {
                
                /* See if cameraState has just switched */
                
                if previousCameraState != cameraComponent.cameraState {
                    
                    /* In case it has we have to up-invert tileIndex */
                    /* We are doing this by enumerating over tileNodes count +1 (+1 for new placement) and adding one count per time */
                    
                    /* Normally it would be: self.tileNodes.count + 1 but since we start by 0 it goes automatically up to count + 1 */
                    
                    for _ in 0...self.tileNodes.count { tileIndex += 1 }
                    previousCameraState = cameraComponent.cameraState
                }
                
                if absolutePosition.y + tileNode.texture!.size().height <= 0 {
                    
                    /* We have to add old textures size to the lowerPositionOffset since we are moving this node to the upperPositionOffset */
                    
                    lowerPositionOffset += tileNode.texture!.size().height
                    
                    /* We have to work with a reference to new texture since even after changing texture the current child still has its old size! */
                    
                    let newTexture = self.tileSet.tiles[tileIndex]
                    
                    tileNode.run(SKAction.setTexture(newTexture, resize: true))
                    tileNode.position.y = upperPositionOffset
                    
                    /* Add textures size to the position offset */
                    
                    upperPositionOffset += newTexture.size().height
                    tileIndex += 1
                }
            }
            
            /* Camera is moving down */
            
            else if cameraComponent.cameraState == CameraState.MovingSouth.rawValue {
                
                if absolutePosition.y >= GameSceneSettings.height {
                    
                    /* See if cameraState has just switched */
                    
                    if previousCameraState != cameraComponent.cameraState {
                        
                        /* In case it has we have to down-invert tileIndex */
                        /* We are doing this by enumerating over tileNodes count +1 (for new placement) and substracting one count per time */
                        
                        /* Normally it would be: self.tileNodes.count + 1 but since we start by 0 it goes automatically up to count + 1 */
                        
                        for _ in 0...self.tileNodes.count { tileIndex -= 1 }
                        previousCameraState = cameraComponent.cameraState
                    }
                    
                    /* We have to substract old texture size from upperPositionOffset since we are moving this node to the lowerPositionOffset */
                    
                    upperPositionOffset -= tileNode.texture!.size().height
                    
                    /* We have to work with a reference to new texture since even after changing texture the current child still has its old size! */
                    
                    let newTexture = self.tileSet.tiles[tileIndex]
                    
                    /* When moving down we have to substract newTextures height before replacing it due to Y-AnchorPoint = 0 */
                    
                    lowerPositionOffset -= newTexture.size().height
                    
                    tileNode.run(SKAction.setTexture(newTexture, resize: true))
                    tileNode.position.y = lowerPositionOffset
                    
                    tileIndex -= 1
                }
            }
        }
    }
    
    // MARK: Class Methods
    
    class func tileSetFromAtlas(_ tileAtlas: SKTextureAtlas) -> TileSet {
        
        var textures = [SKTexture]()
        
        let sortedTextureNames = tileAtlas.textureNames.sorted { $0 < $1 }
        var startTexture: SKTexture?
        
        for textureName: String in sortedTextureNames {
            
            if textureName.lowercased().contains("bottom") {
                
                startTexture = tileAtlas.textureNamed(textureName)
                
            } else {
                
                textures.append(tileAtlas.textureNamed(textureName))

            }
        }
        
        return TileSet(tileSize: CGSize(width: 1364, height: 192), tiles: textures, startTile: startTexture)
    }
}
